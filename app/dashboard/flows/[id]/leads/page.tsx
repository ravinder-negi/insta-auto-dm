import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon, MailIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/PageHeader";
import { EmptyState } from "../../../components/EmptyState";
import { LeadsTable } from "../../LeadsTable";

export default async function FlowLeadsPage(
  props: PageProps<"/dashboard/flows/[id]/leads">
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: flow }, { data: leads }] = await Promise.all([
    supabase.from("dm_flows").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("dm_flow_leads")
      .select("id, ig_sender_id, email, collected_at")
      .eq("flow_id", id)
      .order("collected_at", { ascending: false }),
  ]);

  if (!flow) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/dashboard/flows"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to flows
      </Link>

      <PageHeader
        eyebrow="Collected emails"
        title={flow.name}
        description="Emails collected by this flow's email-collection step, newest first."
      />

      {leads && leads.length > 0 ? (
        <LeadsTable leads={leads} flowName={flow.name} />
      ) : (
        <EmptyState
          icon={<MailIcon className="h-6 w-6" />}
          title="No emails collected yet"
          description="Once someone replies with a valid email to this flow's email-collection step, it'll show up here."
        />
      )}
    </div>
  );
}
