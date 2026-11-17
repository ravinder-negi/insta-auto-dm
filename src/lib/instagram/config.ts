/**
 * Instagram API with Unified Login: every call goes to graph.facebook.com
 * with a Business Integration System User token and an explicit Instagram
 * professional account id (never /me, which is the system user).
 * Hosts are overridable only for testing against a proxy/mock.
 */
export const INSTAGRAM_API_VERSION = process.env.INSTAGRAM_API_VERSION || "v27.0";

export const INSTAGRAM_GRAPH_BASE_URL =
  process.env.INSTAGRAM_GRAPH_BASE_URL || "https://graph.facebook.com";

/** Facebook Login for Business dialog that hosts the Unified Login flow. */
export const META_LOGIN_DIALOG_URL =
  process.env.META_LOGIN_DIALOG_URL || "https://www.facebook.com/dialog/oauth";
