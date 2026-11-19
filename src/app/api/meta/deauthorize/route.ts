import { createAdminClient } from "@/lib/supabase/admin";
import { readSignedRequest } from "@/lib/meta/signedRequest";

const REVOKED_MESSAGE =
  "Auto DM's access was removed in Facebook settings. Reconnect to resume automations.";

/**
 * Meta Deauthorize callback: Meta POSTs here when a person removes the app
 * (Facebook settings → Business integrations).
 *
 * Their token stops working, so their accounts are flagged expired: sweeps
 * and the webhook skip them, and the dashboard shows the reconnect banner.
 * Rows, rules and flows stay, so reconnecting picks up where it left off.
 */
export async function POST(request: Request) {
  const payload = await readSignedRequest(request);
  if (!payload) {
    return Response.json({ error: "Invalid signed_request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("instagram_accounts")
    .update({
      token_status: "expired",
      token_error: REVOKED_MESSAGE,
      updated_at: new Date().toISOString(),
    })
    .eq("meta_user_id", payload.user_id)
    .select("id");

  if (error) {
    console.error("[meta/deauthorize] update failed:", error.message);
    // Non-2xx so Meta retries.
    return Response.json({ error: "Update failed" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    // Safe to log: an app-scoped id, not a secret. Lets us confirm which id
    // Meta actually sends if matching ever misses.
    console.warn("[meta/deauthorize] no accounts matched", {
      metaUserId: payload.user_id,
      issuedAt: payload.issued_at,
    });
  }

  return Response.json({ success: true });
}
