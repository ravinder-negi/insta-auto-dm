"use server";

import { createClient } from "@/lib/supabase/server";

export type LeadMagnetSubmitState =
  | { error: string }
  | { success: true; fileUrl: string }
  | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public, unauthenticated: a visitor trades their email for a lead magnet's
 *  download link. RLS (`lead_magnet_leads_insert_public`) re-checks that the
 *  magnet is active and the profile is published, so this can't be abused to
 *  write leads against arbitrary/unpublished magnets. */
export async function submitLeadMagnetEmail(
  leadMagnetId: string,
  _prevState: LeadMagnetSubmitState,
  formData: FormData
): Promise<LeadMagnetSubmitState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();

  const { data: magnet, error: magnetError } = await supabase
    .from("lead_magnets")
    .select("id, profile_id, file_url, is_active")
    .eq("id", leadMagnetId)
    .eq("is_active", true)
    .maybeSingle();

  if (magnetError || !magnet) {
    return { error: "This download is no longer available." };
  }

  const { error } = await supabase.from("lead_magnet_leads").insert({
    lead_magnet_id: magnet.id,
    profile_id: magnet.profile_id,
    email,
  });

  // 23505 = unique violation: this visitor already submitted their email for
  // this magnet — treat as success and hand back the download link again.
  if (error && error.code !== "23505") {
    return { error: "Something went wrong. Try again." };
  }

  return { success: true, fileUrl: magnet.file_url };
}
