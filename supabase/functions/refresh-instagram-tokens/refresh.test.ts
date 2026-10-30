// Run: node --experimental-strip-types --test supabase/functions  (or deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import type { RefreshResult } from "../_shared/instagramToken.ts";
import { refreshDueTokens, type DueAccount, type TokenStore } from "./refresh.ts";

const NOW = new Date("2026-10-30T03:17:00.000Z");
const DAY = 86_400_000;

function account(id: string, expiresInDays: number | null): DueAccount {
  return {
    id,
    instagram_user_id: `ig_${id}`,
    access_token: `token_${id}`,
    token_expires_at:
      expiresInDays === null ? null : new Date(NOW.getTime() + expiresInDays * DAY).toISOString(),
  };
}

function memoryStore(due: DueAccount[], { supersede = new Set<string>() } = {}) {
  const calls = {
    listDue: [] as { expiresBefore: string; issuedBefore: string }[],
    refreshed: [] as { id: string; accessToken: string; expiresAt: string; refreshedAt: string }[],
    failures: [] as { id: string; expired: boolean; error: string }[],
  };
  const store: TokenStore = {
    async listDue(params) {
      calls.listDue.push(params);
      return due;
    },
    async saveRefreshed(acc, update) {
      if (supersede.has(acc.id)) return false;
      calls.refreshed.push({ id: acc.id, ...update });
      return true;
    },
    async saveFailure(acc, update) {
      calls.failures.push({ id: acc.id, ...update });
    },
  };
  return { store, calls };
}

function refreshBy(results: Record<string, RefreshResult>) {
  const seen: string[] = [];
  return {
    seen,
    refresh: async (token: string) => {
      seen.push(token);
      return results[token];
    },
  };
}

test("asks for tokens expiring within 10 days and at least 24h old", async () => {
  const { store, calls } = memoryStore([]);
  const summary = await refreshDueTokens({ store, refresh: async () => assert.fail(), now: NOW });

  assert.deepEqual(calls.listDue, [
    { expiresBefore: "2026-11-09T03:17:00.000Z", issuedBefore: "2026-10-29T03:17:00.000Z" },
  ]);
  assert.deepEqual(summary, { checked: 0, refreshed: 0, expired: 0, failed: 0, superseded: 0 });
});

test("stores the refreshed token with its new expiry", async () => {
  const { store, calls } = memoryStore([account("a", 5), account("legacy", null)]);
  const { refresh, seen } = refreshBy({
    token_a: { ok: true, accessToken: "new_a", expiresInSeconds: 60 * 86_400 },
    token_legacy: { ok: true, accessToken: "new_legacy", expiresInSeconds: 5_183_944 },
  });

  const summary = await refreshDueTokens({ store, refresh, now: NOW });

  assert.deepEqual(seen, ["token_a", "token_legacy"]);
  assert.deepEqual(calls.refreshed, [
    {
      id: "a",
      accessToken: "new_a",
      expiresAt: "2026-12-29T03:17:00.000Z",
      refreshedAt: NOW.toISOString(),
    },
    {
      id: "legacy",
      accessToken: "new_legacy",
      expiresAt: new Date(NOW.getTime() + 5_183_944_000).toISOString(),
      refreshedAt: NOW.toISOString(),
    },
  ]);
  assert.equal(calls.failures.length, 0);
  assert.equal(summary.refreshed, 2);
});

test("marks a token Meta rejects as expired", async () => {
  const { store, calls } = memoryStore([account("revoked", 7)]);
  const { refresh } = refreshBy({
    token_revoked: { ok: false, invalidToken: true, message: "Session invalidated (code 190/460)" },
  });

  const summary = await refreshDueTokens({ store, refresh, now: NOW });

  assert.deepEqual(calls.failures, [
    { id: "revoked", expired: true, error: "Session invalidated (code 190/460)" },
  ]);
  assert.equal(summary.expired, 1);
});

test("keeps a live token active on a transient failure so the next run retries", async () => {
  const { store, calls } = memoryStore([account("flaky", 3), account("unknown", null)]);
  const transient: RefreshResult = { ok: false, invalidToken: false, message: "Instagram API 502" };
  const { refresh } = refreshBy({ token_flaky: transient, token_unknown: transient });

  const summary = await refreshDueTokens({ store, refresh, now: NOW });

  assert.deepEqual(
    calls.failures.map((f) => [f.id, f.expired]),
    [["flaky", false], ["unknown", false]],
  );
  assert.equal(summary.failed, 2);
  assert.equal(summary.expired, 0);
});

test("marks a token expired when it has already lapsed, whatever the error", async () => {
  const { store, calls } = memoryStore([account("lapsed", -1), account("edge", 0)]);
  const transient: RefreshResult = { ok: false, invalidToken: false, message: "Instagram API 500" };
  const { refresh } = refreshBy({ token_lapsed: transient, token_edge: transient });

  await refreshDueTokens({ store, refresh, now: NOW });

  assert.deepEqual(
    calls.failures.map((f) => [f.id, f.expired]),
    [["lapsed", true], ["edge", true]],
  );
});

test("leaves a row alone when a reconnect replaced its token mid-run", async () => {
  const { store, calls } = memoryStore([account("raced", 2)], { supersede: new Set(["raced"]) });
  const { refresh } = refreshBy({
    token_raced: { ok: true, accessToken: "new_raced", expiresInSeconds: 100 },
  });

  const summary = await refreshDueTokens({ store, refresh, now: NOW });

  assert.equal(calls.refreshed.length, 0);
  assert.equal(calls.failures.length, 0);
  assert.equal(summary.superseded, 1);
});

test("one account failing does not stop the rest", async () => {
  const { store } = memoryStore([account("bad", 1), account("good", 1)]);
  const { refresh } = refreshBy({
    token_bad: { ok: false, invalidToken: true, message: "x" },
    token_good: { ok: true, accessToken: "new_good", expiresInSeconds: 100 },
  });

  const summary = await refreshDueTokens({ store, refresh, now: NOW });
  assert.deepEqual(summary, { checked: 2, refreshed: 1, expired: 1, failed: 0, superseded: 0 });
});
