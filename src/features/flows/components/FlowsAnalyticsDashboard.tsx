"use client";

import { useMemo, useState } from "react";
import { PillSelect } from "@/components/ui/PillSelect";
import {
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  InstagramIcon,
  MailIcon,
} from "@/components/icons";
import { StatTile } from "@/features/analytics/components/chart-primitives";
import { displayFont } from "@/lib/linkInBioTheme";
import { FlowStepFunnel } from "@/features/flows/components/FlowStepFunnel";
import { FlowLeaderboard, type FlowPerformance } from "@/features/flows/components/FlowLeaderboard";

const DAY_MS = 86_400_000;

const RANGES: Record<string, { label: string; days: number | null }> = {
  "7": { label: "Last 7 days", days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
  all: { label: "All time", days: null },
};

export interface FlowInfo {
  id: string;
  name: string;
  accountId: string | null;
  accountHandle: string;
  isActive: boolean;
}

export interface AccountOption {
  id: string;
  handle: string;
}

/** Conversations started on one UTC day, grouped by flow / account / status
 *  / current step — see public.flow_analytics_rollup. */
export interface FlowSessionInfo {
  day: string;
  flowId: string;
  accountId: string | null;
  status: string;
  currentStepOrder: number;
  count: number;
}

export interface FlowStepInfo {
  flowId: string;
  stepOrder: number;
}

/** Emails collected on one UTC day, grouped by flow / account. */
export interface FlowLeadInfo {
  day: string;
  flowId: string;
  accountId: string | null;
  count: number;
}

function sumCounts(rows: { count: number }[]): number {
  return rows.reduce((total, row) => total + row.count, 0);
}

export function FlowsAnalyticsDashboard({
  flows,
  accounts,
  sessions,
  steps,
  leads,
  now,
}: {
  flows: FlowInfo[];
  accounts: AccountOption[];
  sessions: FlowSessionInfo[];
  steps: FlowStepInfo[];
  leads: FlowLeadInfo[];
  now: number;
}) {
  const [range, setRange] = useState("30");
  const [accountId, setAccountId] = useState("all");

  const view = useMemo(() => {
    const days = RANGES[range].days;
    // Rows are bucketed by UTC day, so "last N days" means today plus the
    // N-1 days before it (same convention as the AutoDMs analytics).
    const sinceDay =
      days === null ? null : new Date(now - (days - 1) * DAY_MS).toISOString().slice(0, 10);

    const matchesAccount = (rowAccountId: string | null) =>
      accountId === "all" || rowAccountId === accountId;

    const filteredSessions = sessions.filter(
      (session) =>
        matchesAccount(session.accountId) && (sinceDay === null || session.day >= sinceDay)
    );
    const filteredLeads = leads.filter(
      (lead) => matchesAccount(lead.accountId) && (sinceDay === null || lead.day >= sinceDay)
    );

    const total = sumCounts(filteredSessions);
    const completed = sumCounts(filteredSessions.filter((s) => s.status === "completed"));
    const active = sumCounts(filteredSessions.filter((s) => s.status === "active"));
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : null;

    // Each flow has its own steps, so a session only counts toward step N if
    // its own flow actually has a step N.
    const stepOrdersByFlow = new Map<string, Set<number>>();
    let maxStepOrder = 0;
    for (const step of steps) {
      const set = stepOrdersByFlow.get(step.flowId) ?? new Set<number>();
      set.add(step.stepOrder);
      stepOrdersByFlow.set(step.flowId, set);
      if (step.stepOrder > maxStepOrder) maxStepOrder = step.stepOrder;
    }

    const reachedByStep = new Map<number, number>();
    for (const session of filteredSessions) {
      const flowSteps = stepOrdersByFlow.get(session.flowId);
      if (!flowSteps) continue;
      for (const stepOrder of flowSteps) {
        if (session.currentStepOrder >= stepOrder) {
          reachedByStep.set(stepOrder, (reachedByStep.get(stepOrder) ?? 0) + session.count);
        }
      }
    }

    const funnel = Array.from({ length: maxStepOrder }, (_, i) => i + 1).map(
      (stepOrder) => ({
        stepOrder,
        label: `Step ${stepOrder}`,
        reached: reachedByStep.get(stepOrder) ?? 0,
      })
    );

    const sessionsByFlow = new Map<string, FlowSessionInfo[]>();
    for (const session of filteredSessions) {
      const arr = sessionsByFlow.get(session.flowId) ?? [];
      arr.push(session);
      sessionsByFlow.set(session.flowId, arr);
    }
    const emailsByFlow = new Map<string, number>();
    for (const lead of filteredLeads) {
      emailsByFlow.set(lead.flowId, (emailsByFlow.get(lead.flowId) ?? 0) + lead.count);
    }

    const leaderboard: FlowPerformance[] = flows
      .map((flow) => {
        const flowSessions = sessionsByFlow.get(flow.id) ?? [];
        return {
          flowId: flow.id,
          name: flow.name,
          accountHandle: flow.accountHandle,
          isActive: flow.isActive,
          started: sumCounts(flowSessions),
          completed: sumCounts(flowSessions.filter((s) => s.status === "completed")),
          active: sumCounts(flowSessions.filter((s) => s.status === "active")),
          emails: emailsByFlow.get(flow.id) ?? 0,
        };
      })
      // A flow that never started a conversation in this period has nothing to rank.
      .filter((row) => row.started > 0);

    return { total, completed, active, completionRate, emails: sumCounts(filteredLeads), funnel, leaderboard };
  }, [flows, sessions, steps, leads, range, accountId, now]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <PillSelect value={range} onChange={setRange} icon={<CalendarIcon className="h-4 w-4" />} ariaLabel="Filter by date range">
          {Object.entries(RANGES).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </PillSelect>

        <PillSelect
          value={accountId}
          onChange={setAccountId}
          icon={<InstagramIcon className="h-4 w-4" />}
          ariaLabel="Filter by account"
        >
          <option value="all">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              @{account.handle}
            </option>
          ))}
        </PillSelect>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Conversations started" value={view.total} tone="violet" icon={<ChartIcon className="h-5 w-5" />} />
        <StatTile
          label="Completed"
          value={view.completed}
          tone="green"
          icon={<CheckIcon className="h-5 w-5" />}
          corner={view.completionRate !== null ? `${view.completionRate}%` : undefined}
        />
        <StatTile label="Still active" value={view.active} tone="amber" icon={<ClockIcon className="h-5 w-5" />} />
        <StatTile label="Emails collected" value={view.emails} tone="pink" icon={<MailIcon className="h-5 w-5" />} />
      </div>

      {view.total === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[36px] border-[1.5px] border-dashed border-[var(--secondary-border)] bg-[var(--secondary-faint-bg)] px-7 py-14 text-center">
          <span className="animate-float flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[var(--violet)] text-white">
            <ChartIcon className="h-[34px] w-[34px]" />
          </span>
          <h3 className={`m-0 ${displayFont} text-[28px] font-extrabold tracking-[-0.03em]`}>
            Nothing to chart in this period
          </h3>
          <p className="m-0 max-w-[380px] text-[var(--muted)]">
            Try a wider date range, or check back once your DM flows start replying to comments.
          </p>
        </div>
      ) : (
        <>
          <FlowStepFunnel funnel={view.funnel} total={view.total} />
          <FlowLeaderboard rows={view.leaderboard} />
        </>
      )}
    </div>
  );
}
