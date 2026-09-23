"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL_PLATFORM_META, SOCIAL_PLATFORMS } from "./socialPlatforms";
import type { SocialPlatform } from "@/lib/types";

export type SocialsFormState = { error: string } | { success: true } | undefined;

export async function updateSocials(
  _prevState: SocialsFormState,
  formData: FormData
): Promise<SocialsFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const upserts: {
    profile_id: string;
    platform: SocialPlatform;
    url: string;
    is_active: boolean;
  }[] = [];
  const deletions: SocialPlatform[] = [];

  for (const platform of SOCIAL_PLATFORMS) {
    const url = String(formData.get(`${platform}_url`) ?? "").trim();
    const isActive = formData.get(`${platform}_active`) === "on";

    if (!url) {
      deletions.push(platform);
      continue;
    }

    const meta = SOCIAL_PLATFORM_META[platform];
    if (!meta.urlPattern.test(url)) {
      return { error: `${meta.label} link ${meta.urlHint}.` };
    }

    const storedUrl = platform === "email" ? `mailto:${url}` : url;
    upserts.push({ profile_id: user.id, platform, url: storedUrl, is_active: isActive });
  }

  if (upserts.length > 0) {
    const { error } = await supabase
      .from("profile_socials")
      .upsert(upserts, { onConflict: "profile_id,platform" });
    if (error) return { error: error.message };
  }

  if (deletions.length > 0) {
    const { error } = await supabase
      .from("profile_socials")
      .delete()
      .eq("profile_id", user.id)
      .in("platform", deletions);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/socials");
  revalidatePath("/[username]", "page");
  return { success: true };
}
