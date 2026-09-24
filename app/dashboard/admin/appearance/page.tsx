import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { PageHeader } from "../../components/PageHeader";
import { AppearanceForm } from "./AppearanceForm";
import type { AppSettings } from "@/lib/types";

export default async function AdminAppearancePage() {
  if (!(await isAdmin())) notFound();

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single<AppSettings>();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Admin"
        title="Appearance"
        description="App-wide brand color. Only visible to admins."
      />

      <AppearanceForm accentColor={settings?.accent_color ?? "#6d5ef6"} />
    </div>
  );
}
