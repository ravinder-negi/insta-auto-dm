"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  INSTAGRAM_API_VERSION as API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
} from "@/lib/instagram/config";
import { getOwnAccountTokens } from "@/lib/instagram/tokens";

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

/**
 * Best effort: a dead token or a Meta outage must not block disconnecting.
 * Anything Meta still sends afterwards is dropped by the webhook, which
 * ignores accounts it doesn't know.
 */
async function unsubscribeFromWebhooks(instagramUserId: string, accessToken: string) {
  try {
    const url = new URL(
      `${INSTAGRAM_GRAPH_BASE_URL}/${API_VERSION}/${instagramUserId}/subscribed_apps`,
    );
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url, {
      method: "DELETE",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      // Safe to log: the IG account id and Meta's error fields, never the token.
      console.error("Instagram webhook unsubscribe failed", {
        instagramUserId,
        httpStatus: response.status,
        metaErrorCode: body?.error?.code,
        metaErrorMessage: body?.error?.message,
      });
    }
  } catch (error) {
    console.error("Instagram webhook unsubscribe failed", {
      instagramUserId,
      error: String(error),
    });
  }
}
