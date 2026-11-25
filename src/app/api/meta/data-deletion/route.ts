import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { readSignedRequest } from "@/lib/meta/signedRequest";
import { unsubscribeFromWebhooks } from "@/lib/instagram/webhookSubscription";

const STATUS_PATH = "/data-deletion/status";

/**
 * Meta Data Deletion Request callback: Meta POSTs here when a person asks
 * Facebook to delete the data DMLink got about them.
 *
 * Deletes the Instagram accounts they connected and everything sourced from
 * those accounts (tokens, rules, flows, leads, comment and DM history). The
 * DMLink login and profile stay; those come from our own sign-up, not Meta.
 *
 * Meta requires `{ url, confirmation_code }` back, where `url` lets the
 * person check the request's status.
 *
 * In practice this rarely matches anything: meta_user_id holds the system
 * user's id, not the person's (see the Instagram connect callback), and Meta
 * didn't call this when the app was removed from Business Integrations in
 * testing. It stays registered because Meta requires a deletion URL. Users
 * delete their data by disconnecting or deleting their account.
 */
export async function POST(request: Request) {
  const payload = await readSignedRequest(request);
  if (!payload) {
    return Response.json({ error: "Invalid signed_request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: accounts, error: lookupError } = await admin
    .from("instagram_accounts")
    .select("id, instagram_user_id, access_token")
    .eq("meta_user_id", payload.user_id);

  if (lookupError) {
    console.error("[meta/data-deletion] lookup failed:", lookupError.message);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }

  let deletedAccounts = 0;

  if (accounts && accounts.length > 0) {
    // While the tokens still exist. Best effort: the token is often already
    // revoked, and the webhook drops events for accounts it doesn't know.
    await Promise.all(
      accounts.map((account) =>
        unsubscribeFromWebhooks(account.instagram_user_id, account.access_token),
      ),
    );

    const { data: deleted, error: deleteError } = await admin.rpc(
      "delete_instagram_account_data",
      { account_ids: accounts.map((account) => account.id) },
    );

    if (deleteError) {
      console.error("[meta/data-deletion] delete failed:", deleteError.message);
      // Non-2xx so Meta retries.
      return Response.json({ error: "Deletion failed" }, { status: 500 });
    }
    deletedAccounts = typeof deleted === "number" ? deleted : accounts.length;
  } else {
    // Safe to log: an app-scoped id, not a secret. Lets us confirm which id
    // Meta actually sends if matching ever misses.
    console.warn("[meta/data-deletion] no accounts matched", {
      metaUserId: payload.user_id,
      issuedAt: payload.issued_at,
    });
  }

  const confirmationCode = randomBytes(12).toString("hex");

  const { error: insertError } = await admin.from("data_deletion_requests").insert({
    confirmation_code: confirmationCode,
    meta_user_id: payload.user_id,
    status: deletedAccounts > 0 ? "completed" : "no_data",
    deleted_accounts: deletedAccounts,
  });

  if (insertError) {
    // The data is already gone; a retry from Meta just finds nothing to
    // delete and records the request then.
    console.error("[meta/data-deletion] recording request failed:", insertError.message);
    return Response.json({ error: "Recording request failed" }, { status: 500 });
  }

  const statusUrl = new URL(STATUS_PATH, request.url);
  statusUrl.searchParams.set("code", confirmationCode);

  return Response.json({
    url: statusUrl.toString(),
    confirmation_code: confirmationCode,
  });
}
