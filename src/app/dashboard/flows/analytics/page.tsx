import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "@/components/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { currentTimestamp } from "@/lib/utils/format";
import { FlowsAnalyticsDashboard } from "@/features/flows/components/FlowsAnalyticsDashboard";

type FlowQueryRow = {
  id: string;
  name: string;
  is_active: boolean;
  instagram_account_id: string | null;
  instagram_accounts: { username: string | null; instagram_user_id: string } | null;
};

export default async function FlowsAnalyticsPage() {
  const supabase = await createClient();

  const [
    { data: flows },
    { data: accountsData },
    { data: sessions },
    { data: steps },
    { data: leads },
  ] = await Promise.all([
    supabase
      .from("dm_flows")
      .select(
        "id, name, is_active, instagram_account_id, instagram_accounts(username, instagram_user_id)"
      ),
    supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("dm_flow_sessions")
      .select("id, flow_id, instagram_account_id, status, current_step_order, started_at"),
    supabase.from("dm_flow_steps").select("flow_id, step_order"),
    supabase.from("dm_flow_leads").select("id, flow_id, instagram_account_id, collected_at"),
  ]);

  const flowInfos = ((flows as unknown as FlowQueryRow[]) ?? []).map((flow) => ({
    id: flow.id,
    name: flow.name,
    accountId: flow.instagram_account_id,
    accountHandle:
      flow.instagram_accounts?.username ??
      flow.instagram_accounts?.instagram_user_id ??
      "unknown",
    isActive: flow.is_active,
  }));

  const accounts = (accountsData ?? []).map((account) => ({
    id: account.id as string,
    handle: (account.username ?? account.instagram_user_id) as string,
  }));

  const sessionInfos = (sessions ?? []).map((session) => ({
    id: session.id as string,
    flowId: session.flow_id as string,
    accountId: session.instagram_account_id as string | null,
    status: session.status as string,
    currentStepOrder: session.current_step_order as number,
    startedAt: session.started_at as string,
  }));

  const stepInfos = (steps ?? []).map((step) => ({
    flowId: step.flow_id as string,
    stepOrder: step.step_order as number,
  }));

  const leadInfos = (leads ?? []).map((lead) => ({
    id: lead.id as string,
    flowId: lead.flow_id as string,
    accountId: lead.instagram_account_id as string | null,
    collectedAt: lead.collected_at as string,
  }));

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
        eyebrow="Insights"
        title="Flow analytics"
        description="How far people get through your DM flows, which ones perform best, and what they've collected."
      />

      <FlowsAnalyticsDashboard
        flows={flowInfos}
        accounts={accounts}
        sessions={sessionInfos}
        steps={stepInfos}
        leads={leadInfos}
        now={currentTimestamp()}
      />
    </div>
  );
}
