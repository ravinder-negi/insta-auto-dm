"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ThemeButtonStyle, ThemeFont, ThemeLayout } from "@/lib/types";

export type ThemeFormState = { error: string } | { success: true } | undefined;

const THEME_FONTS: ThemeFont[] = ["sans", "serif", "mono"];
const THEME_BUTTON_STYLES: ThemeButtonStyle[] = ["pill", "rounded", "square"];
const THEME_LAYOUTS: ThemeLayout[] = ["center", "left"];

export async function updateTheme(
  _prevState: ThemeFormState,
  formData: FormData
): Promise<ThemeFormState> {
  const themeFont = String(formData.get("theme_font") ?? "");
  const themeButtonStyle = String(formData.get("theme_button_style") ?? "");
  const themeLayout = String(formData.get("theme_layout") ?? "");

  if (!THEME_FONTS.includes(themeFont as ThemeFont)) {
    return { error: "Invalid font." };
  }
  if (!THEME_BUTTON_STYLES.includes(themeButtonStyle as ThemeButtonStyle)) {
    return { error: "Invalid button style." };
  }
  if (!THEME_LAYOUTS.includes(themeLayout as ThemeLayout)) {
    return { error: "Invalid layout." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      theme_font: themeFont,
      theme_button_style: themeButtonStyle,
      theme_layout: themeLayout,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/theme");
  revalidatePath("/[username]", "page");
  return { success: true };
}
