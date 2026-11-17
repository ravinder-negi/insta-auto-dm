// Run: node --experimental-strip-types --test supabase/functions  (or deno test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { describeGraphError, isInvalidTokenError } from "./instagramToken.ts";

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
