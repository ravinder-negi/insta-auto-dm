import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { META_LOGIN_DIALOG_URL } from "@/lib/instagram/config";

const STATE_COOKIE = "ig_oauth_state";

/**
 * Starts Instagram API with Unified Login. Permissions, requested assets and
 * token expiry all live in the App Dashboard configuration named by
 * META_CONFIG_ID, so no scope list is sent here.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const appId = process.env.META_APP_ID;
  const configId = process.env.META_CONFIG_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!appId || !configId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "Instagram connect is not configured. Set META_APP_ID, META_CONFIG_ID and INSTAGRAM_REDIRECT_URI.",
      },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();

  // Same parameters as the Login URL the App Dashboard generates for the
  // configuration; prompt=login always offers both Instagram and Facebook.
  const authorizeUrl = new URL(META_LOGIN_DIALOG_URL);
  authorizeUrl.searchParams.set("client_id", appId);
  authorizeUrl.searchParams.set("config_id", configId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("override_default_response_type", "true");
  authorizeUrl.searchParams.set("prompt", "login");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
