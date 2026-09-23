import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/PageHeader";
import { EmptyState } from "../../../components/EmptyState";
import { MailIcon } from "../../../components/icons";
import { formatDate } from "../../../components/format";
import type { LeadMagnetLead } from "@/lib/types";

export default async function LeadMagnetLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: magnet }, { data: leads }] = await Promise.all([
    supabase.from("lead_magnets").select("id, title").eq("id", id).maybeSingle(),
    supabase
      .from("lead_magnet_leads")
      .select("*")
      .eq("lead_magnet_id", id)
      .order("created_at", { ascending: false })
      .returns<LeadMagnetLead[]>(),
  ]);

  if (!magnet) {
    notFound();
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
          eyebrow="Leads"
          title={magnet.title}
          description={`${leads?.length ?? 0} email${leads?.length === 1 ? "" : "s"} captured for this lead magnet.`}
        />
      </div>

      {!leads || leads.length === 0 ? (
        <EmptyState
          icon={<MailIcon className="h-6 w-6" />}
          title="No leads yet"
          description="Emails visitors submit for this lead magnet will show up here."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/6 text-left text-xs font-semibold tracking-[0.08em] text-zinc-400 uppercase dark:border-white/8">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Captured</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-black/6 last:border-0 dark:border-white/8">
                  <td className="px-5 py-3.5 font-medium">{lead.email}</td>
                  <td className="px-5 py-3.5 text-zinc-500">{formatDate(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
