import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../components/PageHeader";
import { SocialsForm } from "./SocialsForm";
import type { ProfileSocial } from "@/lib/types";

export default async function SocialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profile_socials")
    .select("*")
    .eq("profile_id", user.id)
    .returns<ProfileSocial[]>();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Link-in-bio"
        title="Social accounts"
        description="Connect your social profiles to show them on your public page."
      />

      <SocialsForm socials={data ?? []} />
    </div>
  );
}
