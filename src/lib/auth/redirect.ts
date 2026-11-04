/** Where a signed-in user lands when nothing else was asked for: Home. */
export const DEFAULT_AFTER_LOGIN = "/dashboard";

const PLACEHOLDER_ORIGIN = "https://redirect.invalid";

/**
 * A redirect target taken from the URL or a form must stay on this site.
 * "/dashboard/rules?x=1" is fine. Anything a browser could read as another
 * host falls back: "//evil.com", "/\evil.com", and variants hidden with tabs
 * or newlines ("/\t/evil.com"), which URL parsing strips before resolving.
 * Full URLs and empty values fall back too.
 */
export function safeRedirectPath(raw: unknown, fallback = DEFAULT_AFTER_LOGIN): string {
  if (typeof raw !== "string" || !raw.startsWith("/")) return fallback;
  // Control characters and backslashes have no place in our own paths.
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;

  let url: URL;
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;

  return `${url.pathname}${url.search}${url.hash}`;
}
