import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export interface SignedRequestPayload {
  /** App-scoped Facebook user id of the person the callback is about. */
  user_id: string;
  algorithm: string;
  issued_at?: number;
}

/**
 * Verifies and decodes a Meta `signed_request` (`<signature>.<payload>`,
 * both base64url). The signature is HMAC-SHA256 of the raw payload string
 * keyed with the app secret.
 *
 * Returns null for anything that isn't a valid, correctly signed request,
 * so callers can treat every failure the same way.
 */
export function parseSignedRequest(
  signedRequest: string,
  appSecret: string,
): SignedRequestPayload | null {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;
  const [encodedSignature, encodedPayload] = parts;
  if (!encodedSignature || !encodedPayload) return null;

  const signature = Buffer.from(encodedSignature, "base64url");
  const expected = createHmac("sha256", appSecret).update(encodedPayload).digest();
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") return null;
  const { algorithm, user_id: userId, issued_at: issuedAt } = payload as Record<string, unknown>;

  if (typeof algorithm !== "string" || algorithm.toUpperCase() !== "HMAC-SHA256") return null;
  // Meta sends the id as a string; accept a number too rather than drop it.
  if (typeof userId !== "string" && typeof userId !== "number") return null;
  if (userId === "") return null;

  return {
    user_id: String(userId),
    algorithm,
    issued_at: typeof issuedAt === "number" ? issuedAt : undefined,
  };
}

/**
 * Reads `signed_request` from a Meta callback (form-encoded POST body) and
 * verifies it. Returns null when it's missing, malformed or badly signed, or
 * the app secret isn't configured.
 */
export async function readSignedRequest(request: Request): Promise<SignedRequestPayload | null> {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("META_APP_SECRET is not configured; can't verify Meta signed_request.");
    return null;
  }

  const form = await request.formData().catch(() => null);
  const signedRequest = form?.get("signed_request");
  if (typeof signedRequest !== "string") return null;

  return parseSignedRequest(signedRequest, appSecret);
}
