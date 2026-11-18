"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  // Stop Meta delivering this account's events before the row (and with it
  // the only copy of the token) is gone. Scoped to the signed-in user's own
  // accounts.
  const account = (await getOwnAccountTokens([id]).catch(() => null))?.get(id);
  if (account) {
    await unsubscribeFromWebhooks(account.instagramUserId, account.accessToken);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("instagram_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/accounts");
}
