/**
 * Keyword matching shared by every trigger: comments, story replies and
 * DMs. Pure functions, so they can be unit tested without the webhook.
 */

/**
 * Word-boundary, case-insensitive containment — the keyword "ai" matches the
 * comment "ai" or "send me ai" but not "pain". Multi-word keywords work the
 * same way.
 */
export function commentIncludesKeyword(normalizedComment: string, keyword: string) {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return false;

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}_])${escaped}([^\\p{L}\\p{N}_]|$)`,
    "u"
  ).test(normalizedComment);
}

export interface KeywordMatchable {
  keyword_match: "specific" | "any";
  keywords: string[] | null;
  excluded_keywords: string[] | null;
  keyword: string | null;
}

/** Excluded keywords veto a match, including on "any comment" rules. Shared
 *  by automation_rules and dm_flows, which both use the same keyword-set
 *  shape. */
export function commentMatchesRule(rule: KeywordMatchable, normalizedComment: string) {
  const excluded = rule.excluded_keywords ?? [];
  if (excluded.some((word) => commentIncludesKeyword(normalizedComment, word))) {
    return false;
  }

  if (rule.keyword_match === "any") return true;

  const keywords = rule.keywords?.length
    ? rule.keywords
    : rule.keyword
      ? [rule.keyword]
      : [];

  return keywords.some((word) => commentIncludesKeyword(normalizedComment, word));
}

/** Case, surrounding whitespace, punctuation and emoji don't count, so
 *  "Guide!", " GUIDE 🙌" and "guide" all read as "guide". */
export function normalizeWholeMessage(text: string) {
  return text
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}\p{M}]+$/gu, "")
    .replace(/\s+/g, " ");
}

/**
 * A DM is often part of a real conversation, so a dm_keyword rule never
 * fires on "any message", and by default (keyword_exact) only when the
 * whole message is the keyword: "guide" triggers, "can you guide me?"
 * doesn't. Excluded keywords still veto.
 */
export function dmMatchesRule(
  rule: KeywordMatchable & { keyword_exact?: boolean },
  normalizedText: string
) {
  if (rule.keyword_match !== "specific") return false;
  if (!rule.keyword_exact) return commentMatchesRule(rule, normalizedText);

  const excluded = rule.excluded_keywords ?? [];
  if (excluded.some((word) => commentIncludesKeyword(normalizedText, word))) {
    return false;
  }

  const message = normalizeWholeMessage(normalizedText);
  const keywords = rule.keywords?.length
    ? rule.keywords
    : rule.keyword
      ? [rule.keyword]
      : [];

  return keywords.some((word) => {
    const keyword = normalizeWholeMessage(word);
    return keyword.length > 0 && keyword === message;
  });
}
