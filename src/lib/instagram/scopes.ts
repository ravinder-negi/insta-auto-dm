/** Every permission the app needs; each is a checkbox the user can untick on
 *  Instagram's consent screen, so the callback re-checks what was granted. */
export const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
] as const;

const SCOPE_LABELS: Record<(typeof INSTAGRAM_SCOPES)[number], string> = {
  instagram_business_basic: "view your basic profile",
  instagram_business_manage_messages: "send DMs",
  instagram_business_manage_comments: "read comments",
};

/**
 * Meta's code-exchange response lists granted scopes as a comma string or an
 * array, either at the top level or under data[0]. Returns null when it lists
 * none at all, so a response-shape change never blocks connecting.
 */
export function grantedScopes(tokenResponse: unknown): string[] | null {
  if (!tokenResponse || typeof tokenResponse !== "object") return null;

  const body = tokenResponse as { permissions?: unknown; data?: unknown };
  const entry = Array.isArray(body.data) ? body.data[0] : undefined;
  const permissions =
    body.permissions ??
    (entry && typeof entry === "object"
      ? (entry as { permissions?: unknown }).permissions
      : undefined);

  if (typeof permissions === "string") {
    return permissions.split(",").map((scope) => scope.trim()).filter(Boolean);
  }
  if (Array.isArray(permissions)) {
    return permissions.filter((scope): scope is string => typeof scope === "string");
  }
  return null;
}

/** Human-readable labels for the required scopes missing from `granted`. */
export function missingScopeLabels(granted: string[] | null): string[] {
  if (granted === null) return [];
  return INSTAGRAM_SCOPES.filter((scope) => !granted.includes(scope)).map(
    (scope) => SCOPE_LABELS[scope],
  );
}
