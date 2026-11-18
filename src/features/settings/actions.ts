"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnAccountTokens } from "@/lib/instagram/tokens";
import { unsubscribeFromWebhooks } from "@/lib/instagram/webhookSubscription";
import { DELETE_CONFIRMATION } from "./constants";

export type DeleteAccountState = { error: string } | undefined;

/** Buckets where uploads live under `{userId}/…` (see the *Form components). */
const USER_UPLOAD_BUCKETS = ["avatars", "product-images", "link-icons", "lead-magnets"];

/**
 * Permanently deletes the signed-in user and everything they own.
 *
 * Order matters: Meta webhooks are unsubscribed while the tokens still exist,
 * storage is emptied (it doesn't cascade), then deleting the auth user
 * cascades through profiles to every table that hangs off it.
 */
export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  // Checked here too: the UI check is only a convenience.
  if (String(formData.get("confirmation") ?? "").trim() !== DELETE_CONFIRMATION) {
    return { error: `Type ${DELETE_CONFIRMATION} to confirm.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const tokens = await getOwnAccountTokens().catch(() => new Map());
  await Promise.all(
    [...tokens.values()].map((t) => unsubscribeFromWebhooks(t.instagramUserId, t.accessToken)),
  );

  // Explicit, so tokens go even where the profile_id cascade isn't migrated yet.
  const { error: accountsError } = await admin
    .from("instagram_accounts")
    .delete()
    .eq("profile_id", user.id);
  if (accountsError) {
    console.error("[deleteAccount] instagram_accounts delete failed:", accountsError.message);
    return { error: "Couldn't delete your account. Try again or contact us." };
  }

  for (const bucket of USER_UPLOAD_BUCKETS) {
    const removed = await removeUserFolder(admin, bucket, user.id);
    if (!removed) {
      return { error: "Couldn't delete your account. Try again or contact us." };
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("[deleteAccount] auth user delete failed:", deleteError.message);
    return { error: "Couldn't delete your account. Try again or contact us." };
  }

  // The user is gone; this only clears the session cookies.
  await supabase.auth.signOut().catch(() => undefined);

  redirect("/");
}

async function removeUserFolder(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  userId: string,
): Promise<boolean> {
  const storage = admin.storage.from(bucket);

  // Uploads are flat files directly under `{userId}/`. Remove in pages until
  // the folder lists empty.
  for (;;) {
    const { data, error } = await storage.list(userId, { limit: 1000 });
    if (error) {
      console.error(`[deleteAccount] listing ${bucket} failed:`, error.message);
      return false;
    }
    if (!data || data.length === 0) return true;

    const { error: removeError } = await storage.remove(data.map((f) => `${userId}/${f.name}`));
    if (removeError) {
      console.error(`[deleteAccount] removing from ${bucket} failed:`, removeError.message);
      return false;
    }
  }
}
