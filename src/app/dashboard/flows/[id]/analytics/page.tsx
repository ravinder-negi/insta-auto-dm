import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon, ChartIcon, CheckIcon, ClockIcon, MailIcon } from "@/components/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { FlowStepFunnel } from "@/features/flows/components/FlowStepFunnel";
import { EMPTY_FLOW_ROLLUP, type FlowAnalyticsRollup } from "@/features/flows/lib/flowRollup";

export default async function FlowAnalyticsPage(
  props: PageProps<"/dashboard/flows/[id]/analytics">
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: flow }, { data: rollupData }, { data: steps }, { count: leadCount }] =
    await Promise.all([
      supabase.from("dm_flows").select("id, name").eq("id", id).maybeSingle(),
      // Counted in SQL: selecting every session was capped at 1000 rows.
      supabase.rpc("flow_analytics_rollup", { p_flow_id: id }),
      supabase
        .from("dm_flow_steps")
        .select("step_order, message_text")
        .eq("flow_id", id)
        .order("step_order", { ascending: true }),
      supabase
        .from("dm_flow_leads")
        .select("id", { count: "exact", head: true })
        .eq("flow_id", id),
    ]);

  if (!flow) {
    notFound();
  }

  const sessions = ((rollupData as FlowAnalyticsRollup | null) ?? EMPTY_FLOW_ROLLUP).sessions;
  const countWhere = (match: (row: (typeof sessions)[number]) => boolean) =>
    sessions.filter(match).reduce((sum, row) => sum + row.count, 0);

  const total = countWhere(() => true);
  const completed = countWhere((s) => s.status === "completed");
  const active = countWhere((s) => s.status === "active");
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : null;

  const reachedByStep = new Map<number, number>();
  for (const session of sessions) {
    for (const step of steps ?? []) {
      if (session.stepOrder >= step.step_order) {
        reachedByStep.set(step.step_order, (reachedByStep.get(step.step_order) ?? 0) + session.count);
      }
    }
  }

  const funnel = (steps ?? []).map((step) => ({
    stepOrder: step.step_order,
    label: step.message_text,
    reached: reachedByStep.get(step.step_order) ?? 0,
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
        title={flow.name}
        description="How far people get through this flow, and what it's collected."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Conversations started"
          value={total}
          tone="indigo"
          icon={<ChartIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Completed"
          value={completed}
          tone="green"
          icon={<CheckIcon className="h-5 w-5" />}
          corner={completionRate !== null ? `${completionRate}%` : undefined}
        />
        <StatCard
          label="Still active"
          value={active}
          tone="amber"
          icon={<ClockIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Emails collected"
          value={leadCount ?? 0}
          tone="blue"
          icon={<MailIcon className="h-5 w-5" />}
        />
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<ChartIcon className="h-6 w-6" />}
          title="Nothing to chart yet"
          description="Analytics fill in once this flow starts replying to comments."
        />
      ) : (
        <FlowStepFunnel funnel={funnel} total={total} />
      )}
    </div>
  );
}
