"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error: string } | { success: true } | undefined;

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/;
const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const RESERVED_USERNAMES = new Set([
  "dashboard",
  "login",
  "signup",
  "auth",
  "api",
  "forgot-password",
  "reset-password",
  "favicon.ico",
  "admin",
  "www",
]);

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const usernameRaw = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const brandColor = String(formData.get("brand_color") ?? "").trim();
  const isPublished = formData.get("is_published") === "on";

  if (!usernameRaw || !USERNAME_PATTERN.test(usernameRaw)) {
    return {
      error:
        "Username must be 3-30 characters: lowercase letters, numbers, underscores, or hyphens.",
    };
  }

  if (RESERVED_USERNAMES.has(usernameRaw)) {
    return { error: "That username is reserved." };
  }

  if (bio.length > 280) {
    return { error: "Bio must be 280 characters or fewer." };
  }

  if (brandColor && !HEX_COLOR_PATTERN.test(brandColor)) {
    return { error: "Brand color must be a hex value like #6366f1." };
  }

  if (isPublished && !displayName) {
    return { error: "Add a display name before publishing your profile." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: usernameRaw,
      display_name: displayName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      brand_color: brandColor || null,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath(`/${usernameRaw}`);
  return { success: true };
}
