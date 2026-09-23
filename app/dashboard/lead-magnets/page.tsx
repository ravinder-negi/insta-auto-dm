import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { GiftIcon, PlusIcon } from "../components/icons";
import { primaryButtonClass } from "../components/styles";
import { LeadMagnetsList, type LeadMagnetRow } from "./LeadMagnetsList";

export default async function LeadMagnetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("lead_magnets")
    .select("id, title, file_name, is_active, lead_magnet_leads(count)")
    .eq("profile_id", user.id)
    .order("position", { ascending: true });

  const leadMagnets: LeadMagnetRow[] = (data ?? []).map((magnet) => ({
    id: magnet.id as string,
    title: magnet.title as string,
    file_name: magnet.file_name as string | null,
    is_active: magnet.is_active as boolean,
    leadCount:
      (magnet.lead_magnet_leads as { count: number }[] | null)?.[0]?.count ?? 0,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Link-in-bio"
        title="Lead magnets"
        description="Offer free resources in exchange for a visitor's email."
      />

      {leadMagnets.length === 0 ? (
        <EmptyState
          icon={<GiftIcon className="h-6 w-6" />}
          title="No lead magnets yet"
          description="Offer a PDF, ebook, template, or guide to grow your email list."
          action={
            <Link href="/dashboard/lead-magnets/new" className={primaryButtonClass}>
              <PlusIcon className="h-4 w-4" />
              Add your first lead magnet
            </Link>
          }
        />
      ) : (
        <LeadMagnetsList leadMagnets={leadMagnets} />
      )}
    </div>
  );
}
