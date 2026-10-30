// Run: node --experimental-strip-types --test supabase/functions  (or deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { commentMatchesRule, dmMatchesRule, normalizeWholeMessage } from "./keywordMatch.ts";

const rule = (overrides: Partial<Parameters<typeof dmMatchesRule>[0]> = {}) => ({
  keyword_match: "specific" as const,
  keywords: ["guide"],
  excluded_keywords: [],
  keyword: null,
  keyword_exact: true,
  ...overrides,
});

const dm = (text: string, r = rule()) => dmMatchesRule(r, text.trim().toLowerCase());

test("exact: the whole message must be the keyword", () => {
  for (const text of ["guide", "GUIDE", "Guide!", "  guide  ", "guide 🙌", "🙏 GUIDE!!!", "guide."]) {
    assert.equal(dm(text), true, text);
  }
});

test("exact: a keyword inside normal conversation does not trigger", () => {
  for (const text of [
    "hey can you guide me on pricing?",
    "guide me",
    "the guide was great",
    "guides",
    "guidebook",
    "",
    "🙌",
  ]) {
    assert.equal(dm(text), false, text);
  }
});

test("exact: multi-word keywords tolerate spacing and case", () => {
  const r = rule({ keywords: ["Free Guide"] });
  assert.equal(dm("free guide", r), true);
  assert.equal(dm("FREE   GUIDE!", r), true);
  assert.equal(dm("send the free guide", r), false);
});

test("exact: any of several keywords; non-Latin scripts work", () => {
  const r = rule({ keywords: ["price", "गाइड"] });
  assert.equal(dm("PRICE?", r), true);
  assert.equal(dm("गाइड", r), true);
  assert.equal(dm("guide", r), false);
});

test("contains mode: whole-word match anywhere, like comments", () => {
  const r = rule({ keyword_exact: false });
  assert.equal(dm("hey can you guide me?", r), true);
  assert.equal(dm("guidebook", r), false);
});

test("never fires on 'any' keyword_match, even if one slipped into the data", () => {
  assert.equal(dm("anything", rule({ keyword_match: "any", keywords: [] })), false);
  assert.equal(dm("guide", rule({ keyword_match: "any" })), false);
});

test("excluded keywords veto in both modes", () => {
  assert.equal(dm("guide stop", rule({ keyword_exact: false, excluded_keywords: ["stop"] })), false);
  assert.equal(dm("guide", rule({ excluded_keywords: ["guide"] })), false);
});

test("legacy single keyword column still works", () => {
  assert.equal(dm("guide", rule({ keywords: [], keyword: "Guide" })), true);
});

test("blank keywords never match an empty message", () => {
  assert.equal(dm("!!!", rule({ keywords: ["  "] })), false);
});

test("normalizeWholeMessage", () => {
  assert.equal(normalizeWholeMessage("  🙌 Free   Guide!! "), "free guide");
  assert.equal(normalizeWholeMessage("café?"), "café");
});

test("comment matching is unchanged (regression)", () => {
  const comment = { keyword_match: "specific" as const, keywords: ["ai"], excluded_keywords: [], keyword: null };
  assert.equal(commentMatchesRule(comment, "send me ai"), true);
  assert.equal(commentMatchesRule(comment, "pain"), false);
  assert.equal(commentMatchesRule({ ...comment, keyword_match: "any", keywords: [] }, "anything"), true);
});
