"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export type AppearanceFormState = { error: string } | { success: true } | undefined;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function updateAccentColor(
  _prevState: AppearanceFormState,
  formData: FormData
): Promise<AppearanceFormState> {
  // Render-time gating on the page is not a security boundary — re-check here.
  if (!(await isAdmin())) return { error: "Not authorized." };

  const accentColor = String(formData.get("accent_color") ?? "");
  if (!HEX_COLOR.test(accentColor)) return { error: "Invalid color." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ accent_color: accentColor, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
