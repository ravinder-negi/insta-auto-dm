/** Every permission the app needs. They're set on the Unified Login
 *  configuration in the App Dashboard, and a client can still decline one
 *  on the consent screen, so the callback re-checks what was granted. */
export const INSTAGRAM_SCOPES = [
  "instagram_basic",
  "instagram_manage_messages",
  "instagram_manage_comments",
] as const;

const SCOPE_LABELS: Record<(typeof INSTAGRAM_SCOPES)[number], string> = {
  instagram_basic: "view your basic profile",
  instagram_manage_messages: "send DMs",
  instagram_manage_comments: "read comments",
};

/**
 * Granted scopes from a debug_token response ({ data: { scopes: [...] } }).
 * Returns null when it lists none at all, so a response-shape change never
 * blocks connecting.
 */
export function grantedScopes(debugTokenResponse: unknown): string[] | null {
  if (!debugTokenResponse || typeof debugTokenResponse !== "object") return null;

  const data = (debugTokenResponse as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;

  const scopes = (data as { scopes?: unknown }).scopes;
  if (!Array.isArray(scopes)) return null;

  return scopes.filter((scope): scope is string => typeof scope === "string");
}

/** Human-readable labels for the required scopes missing from `granted`. */
export function missingScopeLabels(granted: string[] | null): string[] {
  if (granted === null) return [];
  return INSTAGRAM_SCOPES.filter((scope) => !granted.includes(scope)).map(
    (scope) => SCOPE_LABELS[scope],
  );
}
