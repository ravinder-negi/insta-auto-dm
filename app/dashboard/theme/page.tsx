import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../components/PageHeader";
import type { PreviewLink } from "../components/LinkInBioPreview";
import { ThemeForm } from "./ThemeForm";
import type { Profile, ProfileLink } from "@/lib/types";

export default async function ThemePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: linkRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("profile_links")
      .select("*")
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .returns<ProfileLink[]>(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  const previewLinks: PreviewLink[] = (linkRows ?? []).map((link) => ({
    id: link.id,
    title: link.title,
    link_type: link.link_type,
    icon: link.icon,
    custom_icon_url: link.custom_icon_url,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Link-in-bio"
        title="Theme"
        description="Customize the font, button style, and layout of your public page."
      />

      <ThemeForm profile={profile} previewLinks={previewLinks} />
    </div>
  );
}
