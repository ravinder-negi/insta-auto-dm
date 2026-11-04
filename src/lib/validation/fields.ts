/** Longest URL we store; matches the database check constraints. */
export const MAX_URL_LENGTH = 2048;

/**
 * An absolute http(s) URL with no whitespace. Used for every link, image and
 * file URL a creator saves, which the public profile then renders as an
 * href or <img src> — so javascript:, data: and the like are refused.
 * Case-insensitive on the scheme ("HTTPS://…" is fine).
 */
export function isHttpUrl(value: string): boolean {
  if (!value || value.length > MAX_URL_LENGTH || /\s/.test(value)) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * "#abc" / "#AABBCC" → "#aabbcc"; anything else → null. Always six digits,
 * because the public profile appends alpha suffixes to the brand colour
 * ("#aabbcc1a"), which a three-digit colour would break.
 */
export function normalizeHexColor(value: string): string | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1].toLowerCase();
  return `#${hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex}`;
}
