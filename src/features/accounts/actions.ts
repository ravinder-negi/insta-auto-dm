"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnAccountTokens } from "@/lib/instagram/tokens";
import { unsubscribeFromWebhooks } from "@/lib/instagram/webhookSubscription";

export async function toggleAccountActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("instagram_accounts")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/accounts");
}

export async function disconnectAccount(id: string) {
  // Scoped to the signed-in user's own accounts. This is the ownership check
  // for the service-role delete below, so it must not be skipped.
  const account = (await getOwnAccountTokens([id])).get(id);
  if (!account) {
    throw new Error("Account not found.");
  }

  // Stop Meta delivering this account's events while the token still exists.
  await unsubscribeFromWebhooks(account.instagramUserId, account.accessToken);

  // Deletes the account and everything sourced from it, including the
  // comment, DM and execution history a plain row delete would keep (those
  // foreign keys are ON DELETE SET NULL). Commenters' data shouldn't outlive
  // the connection it was collected for.
  const { error } = await createAdminClient().rpc("delete_instagram_account_data", {
    account_ids: [id],
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/accounts");
}
