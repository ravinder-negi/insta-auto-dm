import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon, MailIcon } from "@/components/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadsTable } from "@/features/flows/components/LeadsTable";

export default async function RuleLeadsPage(
  props: PageProps<"/dashboard/rules/[id]/leads">
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: rule }, { data: leads }] = await Promise.all([
    supabase.from("automation_rules").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("automation_rule_leads")
      .select("id, ig_sender_id, email, collected_at")
      .eq("automation_rule_id", id)
      .order("collected_at", { ascending: false }),
  ]);

  if (!rule) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/dashboard/rules"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to AutoDMs
      </Link>

      <PageHeader
        eyebrow="Collected emails"
        title={rule.name}
        description="Emails collected by this AutoDM's email-collection step, newest first."
      />

      {leads && leads.length > 0 ? (
        <LeadsTable leads={leads} flowName={rule.name} />
      ) : (
        <EmptyState
          icon={<MailIcon className="h-6 w-6" />}
          title="No emails collected yet"
          description="Once someone replies with a valid email to this AutoDM's email-collection step, it'll show up here."
        />
      )}
    </div>
  );
}
