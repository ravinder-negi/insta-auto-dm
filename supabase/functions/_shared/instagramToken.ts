/**
 * Long-lived Instagram Login tokens last ~60 days. Meta lets us swap one for
 * a fresh 60-day token once it's at least 24 hours old and not yet expired —
 * after that, only the account owner reconnecting can get a new one.
 *
 * Shared by refresh-instagram-tokens (the daily refresh) and
 * instagram-webhook (flags a token Meta rejects mid-send).
 */

/** Refresh once a token is inside this many days of expiring. */
export const REFRESH_WINDOW_DAYS = 10;

/** Meta rejects refreshing a token younger than this. */
export const MIN_TOKEN_AGE_HOURS = 24;

/** Fallback lifetime when Meta's response omits expires_in. */
export const DEFAULT_TOKEN_LIFETIME_SECONDS = 60 * 24 * 60 * 60;

export interface GraphError {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
}

export function graphErrorOf(body: unknown): GraphError | null {
  if (!body || typeof body !== "object") return null;
  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== "object") return null;
  return error as GraphError;
}

/**
 * Code 190 is Meta's "invalid OAuth access token": expired, revoked by the
 * user, password changed, or app removed. Every subcode means the same
 * thing for us — the stored token is dead until the owner reconnects.
 */
export function isInvalidTokenError(body: unknown): boolean {
  return graphErrorOf(body)?.code === 190;
}

export function describeGraphError(body: unknown, httpStatus: number): string {
  const error = graphErrorOf(body);
  if (!error) return `Instagram API ${httpStatus}`;
  const subcode = error.error_subcode !== undefined ? `/${error.error_subcode}` : "";
  const code = error.code !== undefined ? ` (code ${error.code}${subcode})` : "";
  return `${error.message ?? `Instagram API ${httpStatus}`}${code}`;
}

export type RefreshResult =
  | { ok: true; accessToken: string; expiresInSeconds: number }
  | { ok: false; invalidToken: boolean; message: string };

export async function refreshLongLivedToken(
  graphBaseUrl: string,
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RefreshResult> {
  const url = new URL(`${graphBaseUrl}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", accessToken);

  let response: Response;
  try {
    response = await fetchImpl(url);
  } catch (networkError) {
    return {
      ok: false,
      invalidToken: false,
      message: `Network error refreshing token: ${String(networkError)}`,
    };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON body; handled below
  }

  const refreshed = body as { access_token?: unknown; expires_in?: unknown } | null;

  if (!response.ok || typeof refreshed?.access_token !== "string") {
    return {
      ok: false,
      invalidToken: isInvalidTokenError(body),
      message: describeGraphError(body, response.status),
    };
  }

  return {
    ok: true,
    accessToken: refreshed.access_token,
    expiresInSeconds:
      typeof refreshed.expires_in === "number" && refreshed.expires_in > 0
        ? refreshed.expires_in
        : DEFAULT_TOKEN_LIFETIME_SECONDS,
  };
}
