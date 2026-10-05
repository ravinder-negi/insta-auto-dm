import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function FlowExecutionsPage(
  props: PageProps<"/dashboard/flows/[id]/executions">
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: flow }, { data: sessions }, { data: steps }] = await Promise.all([
    supabase.from("dm_flows").select("id, name").eq("id", id).maybeSingle(),
    supabase
      .from("dm_flow_sessions")
      .select("id, ig_sender_id, current_step_order, status, started_at, last_interaction_at")
      .eq("flow_id", id)
      .order("last_interaction_at", { ascending: false })
      .limit(200),
    supabase
      .from("dm_flow_steps")
      .select("step_order")
      .eq("flow_id", id)
      .order("step_order", { ascending: false })
      .limit(1),
  ]);

  if (!flow) {
    notFound();
  }

  const rows: FlowSessionRow[] = (sessions ?? []).map((session) => ({
    id: session.id,
    ig_sender_id: session.ig_sender_id,
    current_step_order: session.current_step_order,
    status: session.status,
    started_at: session.started_at,
    last_interaction_at: session.last_interaction_at,
  }));

  const totalSteps = steps?.[0]?.step_order ?? null;

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
        title={flow.name}
        description="Every conversation started by this flow, newest first."
      />

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
          description="Once someone comments this flow's trigger keyword, their conversation shows up here."
        />
      ) : (
        <FlowSessionsTable
          sessions={rows}
          totalSteps={totalSteps}
          now={currentTimestamp()}
        />
      )}
    </div>
  );
}
