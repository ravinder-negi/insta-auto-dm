"use server";

import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Public, unauthenticated: logs one page view of a published profile. Fired
 *  from the page component on every render — RLS (`profile_views_insert_public`)
 *  re-checks the profile is still published, so a rejected insert never fails
 *  the page, but it's logged (not swallowed) so a misconfigured policy or a
 *  missing migration shows up in the server console instead of vanishing.
 *
 *  Takes a pre-built client rather than calling createClient() itself: this
 *  runs inside next/server's `after()`, and createClient() reads cookies(),
 *  which `after()` callbacks aren't allowed to call. */
export async function recordProfileView(
  supabase: SupabaseServerClient,
  profileId: string,
  referrer: string | null,
  utm: { source: string | null; medium: string | null; campaign: string | null }
) {
  const { error } = await supabase.from("profile_views").insert({
    profile_id: profileId,
    referrer,
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
  });

  if (error) {
    console.error("[recordProfileView] insert failed:", error.message, { profileId });
  }
}

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
