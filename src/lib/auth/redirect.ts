/** Where a signed-in user lands when nothing else was asked for: Home. */
export const DEFAULT_AFTER_LOGIN = "/dashboard";

/**
 * A redirect target taken from the URL or a form must stay on this site.
 * "/dashboard/rules" is fine; "//evil.com" and "/\evil.com" are read by
 * browsers as another host, and anything else (a full URL, empty) falls back.
 */
export function safeRedirectPath(raw: unknown, fallback = DEFAULT_AFTER_LOGIN): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
