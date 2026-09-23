import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "../../components/icons";
import { PageHeader } from "../../components/PageHeader";
import { LeadMagnetForm } from "../LeadMagnetForm";
import { createLeadMagnet } from "../actions";

export default async function NewLeadMagnetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Link
          href="/dashboard/lead-magnets"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to lead magnets
        </Link>
        <PageHeader
          eyebrow="Create lead magnet"
          title="New lead magnet"
          description="Offer a free resource in exchange for a visitor's email."
        />
      </div>

      <LeadMagnetForm action={createLeadMagnet} submitLabel="Add lead magnet" userId={user.id} />
    </div>
  );
}
