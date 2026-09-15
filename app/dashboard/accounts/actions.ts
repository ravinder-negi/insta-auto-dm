"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
