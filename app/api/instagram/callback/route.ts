import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE = "ig_oauth_state";
const API_VERSION = process.env.INSTAGRAM_API_VERSION || "v26.0";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const errorParam = url.searchParams.get("error_description");

  if (errorParam) {
    return redirectWithError(request, errorParam);
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

  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    return redirectWithError(
      request,
      "Instagram connect is not configured on the server."
    );
  }

  try {
    // 1. Exchange the authorization code for a short-lived token.
    const shortLivedForm = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });

    const shortLivedResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      { method: "POST", body: shortLivedForm }
    );

    if (!shortLivedResponse.ok) {
      throw new Error(
        `Short-lived token exchange failed: ${await shortLivedResponse.text()}`
      );
    }

    const shortLived = (await shortLivedResponse.json()) as {
      access_token: string;
      user_id?: string;
    };

    // 2. Exchange the short-lived token for a long-lived one (~60 days).
    const longLivedUrl = new URL("https://graph.instagram.com/access_token");
    longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
    longLivedUrl.searchParams.set("client_secret", appSecret);
    longLivedUrl.searchParams.set("access_token", shortLived.access_token);

    const longLivedResponse = await fetch(longLivedUrl);

    if (!longLivedResponse.ok) {
      throw new Error(
        `Long-lived token exchange failed: ${await longLivedResponse.text()}`
      );
    }

    const longLived = (await longLivedResponse.json()) as {
      access_token: string;
    };

    // 3. Fetch the connected Instagram account's identity.
    const meUrl = new URL(`https://graph.instagram.com/${API_VERSION}/me`);
    meUrl.searchParams.set("fields", "user_id,username");
    meUrl.searchParams.set("access_token", longLived.access_token);

    const meResponse = await fetch(meUrl);

    if (!meResponse.ok) {
      throw new Error(`Fetching Instagram profile failed: ${await meResponse.text()}`);
    }

    const me = (await meResponse.json()) as {
      user_id: string;
      username?: string;
    };

    // 4. Store the account, owned by the signed-in user.
    const { error: upsertError } = await supabase
      .from("instagram_accounts")
      .upsert(
        {
          profile_id: user.id,
          instagram_user_id: me.user_id,
          username: me.username ?? null,
          access_token: longLived.access_token,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "instagram_user_id" }
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  } catch (err) {
    console.error("Instagram connect failed:", err);
    return redirectWithError(
      request,
      "Could not connect that Instagram account. Please try again."
    );
  }

  const response = NextResponse.redirect(
    new URL("/dashboard/accounts", request.url)
  );
  response.cookies.delete(STATE_COOKIE);
  return response;
}

function redirectWithError(request: NextRequest, message: string) {
  const url = new URL("/dashboard/accounts", request.url);
  url.searchParams.set("error", message);
  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
