/**
 * Instagram API with Unified Login: every call goes to graph.facebook.com
 * with a Business Integration System User token and an explicit Instagram
 * professional account id (never /me, which is the system user).
 * Hosts are overridable only for testing against a proxy/mock.
 */
export const INSTAGRAM_API_VERSION = process.env.INSTAGRAM_API_VERSION || "v27.0";

const DEFAULT_GRAPH_BASE_URL = "https://graph.facebook.com";

/**
 * A leftover graph.instagram.com override (from the old Instagram Login
 * setup) makes every call fail with IGApiException 190, so it's ignored.
 */
function graphBaseUrl(override: string | undefined): string {
  if (!override) return DEFAULT_GRAPH_BASE_URL;
  if (override.includes("graph.instagram.com")) {
    console.warn(
      "Ignoring INSTAGRAM_GRAPH_BASE_URL=graph.instagram.com: Unified Login tokens only work on graph.facebook.com.",
    );
    return DEFAULT_GRAPH_BASE_URL;
  }
  return override;
}

export const INSTAGRAM_GRAPH_BASE_URL = graphBaseUrl(process.env.INSTAGRAM_GRAPH_BASE_URL);

/** Facebook Login for Business dialog that hosts the Unified Login flow. */
export const META_LOGIN_DIALOG_URL =
  process.env.META_LOGIN_DIALOG_URL || "https://www.facebook.com/dialog/oauth";
