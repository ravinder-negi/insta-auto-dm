import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AlertIcon, ArrowLeftIcon, CheckIcon, ClockIcon } from "@/components/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { currentTimestamp } from "@/lib/utils/format";
import {
  FlowSessionsTable,
  type FlowSessionRow,
} from "@/features/flows/components/FlowSessionsTable";

type SessionQueryRow = {
  id: string;
  flow_id: string;
  ig_sender_id: string;
  current_step_order: number;
  status: string;
  started_at: string;
  last_interaction_at: string;
  dm_flows: { name: string } | null;
};

export default async function FlowsExecutionsPage() {
  const supabase = await createClient();

  const [{ data, error }, { data: steps }] = await Promise.all([
    supabase
      .from("dm_flow_sessions")
      .select(
        "id, flow_id, ig_sender_id, current_step_order, status, started_at, last_interaction_at, dm_flows(name)"
      )
      .order("last_interaction_at", { ascending: false })
      .limit(200),
    supabase.from("dm_flow_steps").select("flow_id, step_order"),
  ]);

  // Highest step_order per flow — each flow has its own step count.
  const totalStepsByFlow = new Map<string, number>();
  for (const step of steps ?? []) {
    const current = totalStepsByFlow.get(step.flow_id) ?? 0;
    if (step.step_order > current) totalStepsByFlow.set(step.flow_id, step.step_order);
  }

  const sessions = (data as unknown as SessionQueryRow[]) ?? [];

  const rows: FlowSessionRow[] = sessions.map((session) => ({
    id: session.id,
    flowName: session.dm_flows?.name ?? "Deleted flow",
    ig_sender_id: session.ig_sender_id,
    current_step_order: session.current_step_order,
    totalSteps: totalStepsByFlow.get(session.flow_id) ?? null,
    status: session.status,
    started_at: session.started_at,
    last_interaction_at: session.last_interaction_at,
  }));

  const countBy = (status: string) =>
    rows.filter((session) => session.status === status).length;

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
        eyebrow="Logs"
        title="Flow execution log"
        description="Every conversation started by a DM flow, newest first."
      />

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
          {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active"
          value={countBy("active")}
          tone="amber"
          icon={<ClockIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Completed"
          value={countBy("completed")}
          tone="green"
          icon={<CheckIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Expired"
          value={countBy("expired")}
          tone="zinc"
          icon={<AlertIcon className="h-5 w-5" />}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ClockIcon className="h-6 w-6" />}
          title="No conversations yet"
          description="Once someone comments a flow's trigger keyword, their conversation shows up here."
        />
      ) : (
        <FlowSessionsTable sessions={rows} now={currentTimestamp()} />
      )}
    </div>
  );
}
