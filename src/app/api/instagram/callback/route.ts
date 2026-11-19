import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  INSTAGRAM_API_VERSION as API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
} from "@/lib/instagram/config";
import { ONBOARDING_PATH, pendingOnboardingStep } from "@/lib/auth/onboarding";
import {
  debugTokenUserId,
  grantedScopes,
  missingScopeLabels,
} from "@/lib/instagram/scopes";

const STATE_COOKIE = "ig_oauth_state";
const ACCOUNTS_PATH = "/dashboard/accounts";
/** Webhook fields each connected account is subscribed to. */
const SUBSCRIBED_FIELDS = "comments,live_comments,messages";

/** Shown when the failure isn't something the user can act on. Details go to
 *  the server log only, never into the URL. */
const GENERIC_ERROR =
  "Couldn't finish connecting to Instagram. Please try again in a moment.";

/** A failure whose message is safe and useful to show the user as-is. */
class ConnectError extends Error {}

interface MetaError {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

interface AssignedInstagramAccount {
  id: string;
  username?: string;
}

/**
 * Instagram API with Unified Login callback.
 *
 * The code exchanges for a Business Integration System User token that
 * belongs to the client's business portfolio and never expires (set on the
 * App Dashboard configuration). /me with this token is the system user, so
 * the Instagram accounts the client shared come from
 * /me/assigned_instagram_accounts, and every later call names the account
 * id explicitly.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const metaError = url.searchParams.get("error");

  if (metaError) {
    const reason = url.searchParams.get("error_reason");
    if (metaError === "access_denied" || reason === "user_denied") {
      return redirectWithError(
        request,
        "Instagram connection was canceled. Connect again whenever you're ready.",
      );
    }
    console.error("Meta login returned an error", {
      error: metaError,
      reason,
      description: url.searchParams.get("error_description"),
    });
    return redirectWithError(request, GENERIC_ERROR);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithError(request, "Invalid or expired connect request.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // A user still in onboarding connects from there, so send them back to the
  // flow instead of dropping them on the accounts page mid-setup.
  const returnPath = pendingOnboardingStep(user.user_metadata)
    ? ONBOARDING_PATH
    : ACCOUNTS_PATH;

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const configId = process.env.META_CONFIG_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!appId || !appSecret || !configId || !redirectUri) {
    return redirectWithError(
      request,
      "Instagram connect is not configured on the server.",
      returnPath,
    );
  }

  const graph = (path: string) =>
    new URL(`${INSTAGRAM_GRAPH_BASE_URL}/${API_VERSION}/${path}`);

  try {
    // 1. Exchange the code for the system-user token (server-side only).
    const tokenUrl = graph("oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl, { cache: "no-store" });
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${await tokenResponse.text()}`);
    }
    const { access_token: accessToken } = (await tokenResponse.json()) as {
      access_token?: string;
    };
    if (!accessToken) {
      throw new Error("Token exchange returned no access token.");
    }

    // 2. Each permission is a checkbox the client can untick on the consent
    // screen. Without all three the token is valid but sends or comment
    // events fail later with no visible cause, so refuse up front. A
    // debug_token failure skips the check rather than blocking the connect.
    const debugUrl = graph("debug_token");
    debugUrl.searchParams.set("input_token", accessToken);
    debugUrl.searchParams.set("access_token", `${appId}|${appSecret}`);
    const debugBody = await fetch(debugUrl, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);

    // The person who logged in, as Meta names them in the deauthorize and
    // data deletion callbacks (signed_request.user_id).
    const metaUserId = debugTokenUserId(debugBody);

    const missing = missingScopeLabels(grantedScopes(debugBody));
    if (missing.length > 0) {
      throw new ConnectError(
        `Auto DM needs permission to ${missing.join(", ")}. ` +
          "Please connect again and keep every permission switched on.",
      );
    }

    // 3. The business portfolio the client picked. The token belongs to it.
    const businessUrl = graph("me");
    businessUrl.searchParams.set("fields", "client_business_id");
    businessUrl.searchParams.set("access_token", accessToken);

    const businessResponse = await fetch(businessUrl, { cache: "no-store" });
    if (!businessResponse.ok) {
      throw new Error(
        `Fetching business portfolio failed: ${await businessResponse.text()}`,
      );
    }
    const { client_business_id: clientBusinessId } =
      (await businessResponse.json()) as { client_business_id?: string };

    // 4. The Instagram professional account(s) the client shared.
    const accountsUrl = graph("me/assigned_instagram_accounts");
    accountsUrl.searchParams.set("fields", "id,username");
    accountsUrl.searchParams.set("access_token", accessToken);

    const accountsResponse = await fetch(accountsUrl, { cache: "no-store" });
    if (!accountsResponse.ok) {
      throw new Error(
        `Fetching Instagram accounts failed: ${await accountsResponse.text()}`,
      );
    }
    const accounts = (
      ((await accountsResponse.json()) as { data?: AssignedInstagramAccount[] })
        .data ?? []
    ).filter((account) => typeof account?.id === "string" && account.id);

    if (accounts.length === 0) {
      throw new ConnectError(
        "No Instagram account was shared. Connect again and select your " +
          "Instagram professional (Business or Creator) account.",
      );
    }

    // 5. Store each account, owned by the signed-in user. A reconnect lands
    // on the same row (same instagram_user_id), so its rules, flows and
    // sessions carry over, and the token is fresh and active again.
    // Users can't write instagram_accounts themselves (only the OAuth flow
    // proves who owns an Instagram id), so this goes through the service
    // role, with the ownership check RLS used to do made explicit here.
    const admin = createAdminClient();
    const { data: existingRows, error: existingError } = await admin
      .from("instagram_accounts")
      .select("instagram_user_id, profile_id")
      .in(
        "instagram_user_id",
        accounts.map((account) => account.id),
      );

    if (existingError) {
      throw new Error(existingError.message);
    }
    const takenElsewhere = accounts.filter((account) =>
      (existingRows ?? []).some(
        (row) =>
          row.instagram_user_id === account.id &&
          row.profile_id &&
          row.profile_id !== user.id,
      ),
    );
    if (takenElsewhere.length > 0) {
      const names = takenElsewhere
        .map((account) => `@${account.username ?? account.id}`)
        .join(", ");
      throw new ConnectError(
        `${names} is already connected to another Auto DM login. ` +
          "Disconnect it there first.",
      );
    }

    const now = new Date().toISOString();
    const { error: upsertError } = await admin.from("instagram_accounts").upsert(
      accounts.map((account) => ({
        profile_id: user.id,
        instagram_user_id: account.id,
        username: account.username ?? null,
        access_token: accessToken,
        client_business_id: clientBusinessId ?? null,
        meta_config_id: configId,
        meta_user_id: metaUserId,
        // System-user tokens from this configuration never expire.
        token_expires_at: null,
        token_refreshed_at: now,
        token_status: "active",
        token_error: null,
        // Drop any health check queued for the old token, so its answer
        // can't flag this fresh one expired. The token was just used, so
        // count that as this hour's check.
        token_check_request_id: null,
        token_checked_at: now,
        is_active: true,
        updated_at: now,
      })),
      { onConflict: "instagram_user_id" },
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    // 6. Subscribe each account to the app's webhook so Meta actually
    // delivers its events (the App Dashboard webhook config only enables
    // the app; each account must opt in too). It's a set, not an append,
    // so re-subscribing on reconnect is naturally idempotent.
    for (const account of accounts) {
      await subscribeToWebhooks(graph, account, accessToken);
    }
  } catch (err) {
    console.error("Instagram connect failed:", err);
    return redirectWithError(
      request,
      err instanceof ConnectError ? err.message : GENERIC_ERROR,
      returnPath,
    );
  }

  const response = NextResponse.redirect(
    new URL(`${returnPath}?connected=1`, request.url),
  );
  response.cookies.delete(STATE_COOKIE);
  return response;
}

async function subscribeToWebhooks(
  graph: (path: string) => URL,
  account: AssignedInstagramAccount,
  accessToken: string,
) {
  const subscribeUrl = graph(`${account.id}/subscribed_apps`);
  subscribeUrl.searchParams.set("subscribed_fields", SUBSCRIBED_FIELDS);
  subscribeUrl.searchParams.set("access_token", accessToken);

  const subscribeResponse = await fetch(subscribeUrl, { method: "POST" });
  const subscribeBody = await subscribeResponse.json().catch(() => null);

  if (subscribeResponse.ok && subscribeBody?.success === true) return;

  const metaError = subscribeBody?.error as MetaError | undefined;

  // Safe to log: HTTP status + Meta's error fields + the IG account id.
  // Never log the access token or any other secret.
  console.error("Instagram webhook subscription failed", {
    instagramUserId: account.id,
    httpStatus: subscribeResponse.status,
    metaErrorCode: metaError?.code,
    metaErrorSubcode: metaError?.error_subcode,
    metaErrorType: metaError?.type,
    metaErrorMessage: metaError?.message,
    fbtraceId: metaError?.fbtrace_id,
  });

  // The account row is already stored at this point — don't pretend
  // the connection is fully working when events won't actually arrive.
  // Meta's details are in the log above.
  throw new ConnectError(
    `@${account.username ?? account.id} connected, but Instagram didn't turn on ` +
      "comment and DM events for it, so automations won't run yet. Please reconnect.",
  );
}

function redirectWithError(
  request: NextRequest,
  message: string,
  basePath: string = ACCOUNTS_PATH,
) {
  const url = new URL(basePath, request.url);
  url.searchParams.set("error", message);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
