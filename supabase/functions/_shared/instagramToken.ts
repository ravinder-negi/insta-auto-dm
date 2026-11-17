/**
 * Unified Login system-user tokens don't expire, but Meta still rejects one
 * when the client removes the app from their business portfolio or moves the
 * Instagram account to another portfolio. instagram-webhook uses these to
 * flag such a token so the dashboard asks the owner to reconnect.
 */

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
