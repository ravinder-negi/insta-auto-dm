// Run: node --experimental-strip-types --test supabase/functions  (or deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TOKEN_LIFETIME_SECONDS,
  describeGraphError,
  isInvalidTokenError,
  refreshLongLivedToken,
} from "./instagramToken.ts";

function fakeFetch(status: number, body: unknown, seen?: URL[]): typeof fetch {
  return (async (input: URL | RequestInfo) => {
    seen?.push(new URL(String(input)));
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as typeof fetch;
}

const expiredBody = {
  error: {
    message: "Error validating access token: Session has expired",
    type: "OAuthException",
    code: 190,
    error_subcode: 463,
  },
};

test("isInvalidTokenError matches only code 190", () => {
  assert.equal(isInvalidTokenError(expiredBody), true);
  assert.equal(isInvalidTokenError({ error: { code: 4 } }), false);
  assert.equal(isInvalidTokenError({ error: { code: 10 } }), false);
  assert.equal(isInvalidTokenError({}), false);
  assert.equal(isInvalidTokenError(null), false);
  assert.equal(isInvalidTokenError("190"), false);
});

test("describeGraphError includes message, code and subcode", () => {
  assert.equal(
    describeGraphError(expiredBody, 400),
    "Error validating access token: Session has expired (code 190/463)",
  );
  assert.equal(describeGraphError({ error: { code: 4 } }, 403), "Instagram API 403 (code 4)");
  assert.equal(describeGraphError({}, 500), "Instagram API 500");
});

test("refreshLongLivedToken calls the documented endpoint and returns the new token", async () => {
  const seen: URL[] = [];
  const result = await refreshLongLivedToken(
    "https://graph.instagram.com",
    "OLD_TOKEN",
    fakeFetch(200, { access_token: "NEW_TOKEN", token_type: "bearer", expires_in: 5183944 }, seen),
  );

  assert.deepEqual(result, { ok: true, accessToken: "NEW_TOKEN", expiresInSeconds: 5183944 });
  assert.equal(seen[0].origin + seen[0].pathname, "https://graph.instagram.com/refresh_access_token");
  assert.equal(seen[0].searchParams.get("grant_type"), "ig_refresh_token");
  assert.equal(seen[0].searchParams.get("access_token"), "OLD_TOKEN");
});

test("refreshLongLivedToken defaults the lifetime when expires_in is missing", async () => {
  const result = await refreshLongLivedToken("https://g", "T", fakeFetch(200, { access_token: "N" }));
  assert.deepEqual(result, { ok: true, accessToken: "N", expiresInSeconds: DEFAULT_TOKEN_LIFETIME_SECONDS });
});

test("refreshLongLivedToken flags a rejected token as invalid", async () => {
  const result = await refreshLongLivedToken("https://g", "T", fakeFetch(400, expiredBody));
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.invalidToken, true);
  assert.match(!result.ok ? result.message : "", /code 190\/463/);
});

test("refreshLongLivedToken treats rate limits and outages as transient", async () => {
  const rateLimited = await refreshLongLivedToken(
    "https://g",
    "T",
    fakeFetch(400, { error: { message: "Application request limit reached", code: 4 } }),
  );
  assert.equal(!rateLimited.ok && rateLimited.invalidToken, false);

  const outage = await refreshLongLivedToken("https://g", "T", fakeFetch(502, "<html>Bad Gateway</html>"));
  assert.deepEqual(outage, { ok: false, invalidToken: false, message: "Instagram API 502" });

  const network = await refreshLongLivedToken("https://g", "T", (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch);
  assert.equal(!network.ok && network.invalidToken, false);
  assert.match(!network.ok ? network.message : "", /Network error/);
});

test("refreshLongLivedToken rejects a 200 without a token", async () => {
  const result = await refreshLongLivedToken("https://g", "T", fakeFetch(200, { foo: 1 }));
  assert.equal(result.ok, false);
});
