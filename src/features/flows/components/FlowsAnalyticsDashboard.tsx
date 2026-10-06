"use client";

import { useMemo, useState } from "react";
import { SelectField } from "@/components/ui/controls";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  ClockIcon,
  InstagramIcon,
  MailIcon,
} from "@/components/icons";
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

export interface FlowSessionInfo {
  id: string;
  flowId: string;
  accountId: string | null;
  status: string;
  currentStepOrder: number;
  startedAt: string;
}

export interface FlowStepInfo {
  flowId: string;
  stepOrder: number;
}

export interface FlowLeadInfo {
  id: string;
  flowId: string;
  accountId: string | null;
  collectedAt: string;
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
    const sinceMs = days === null ? null : now - days * DAY_MS;

    const matchesAccount = (rowAccountId: string | null) =>
      accountId === "all" || rowAccountId === accountId;

    const filteredSessions = sessions.filter(
      (session) =>
        matchesAccount(session.accountId) &&
        (sinceMs === null || new Date(session.startedAt).getTime() >= sinceMs)
    );
    const filteredLeads = leads.filter(
      (lead) =>
        matchesAccount(lead.accountId) &&
        (sinceMs === null || new Date(lead.collectedAt).getTime() >= sinceMs)
    );

    const total = filteredSessions.length;
    const completed = filteredSessions.filter((s) => s.status === "completed").length;
    const active = filteredSessions.filter((s) => s.status === "active").length;
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
          reachedByStep.set(stepOrder, (reachedByStep.get(stepOrder) ?? 0) + 1);
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
      emailsByFlow.set(lead.flowId, (emailsByFlow.get(lead.flowId) ?? 0) + 1);
    }

    const leaderboard: FlowPerformance[] = flows
      .map((flow) => {
        const flowSessions = sessionsByFlow.get(flow.id) ?? [];
        return {
          flowId: flow.id,
          name: flow.name,
          accountHandle: flow.accountHandle,
          isActive: flow.isActive,
          started: flowSessions.length,
          completed: flowSessions.filter((s) => s.status === "completed").length,
          active: flowSessions.filter((s) => s.status === "active").length,
          emails: emailsByFlow.get(flow.id) ?? 0,
        };
      })
      // A flow that never started a conversation in this period has nothing to rank.
      .filter((row) => row.started > 0);

    return { total, completed, active, completionRate, emails: filteredLeads.length, funnel, leaderboard };
  }, [flows, sessions, steps, leads, range, accountId, now]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SelectField
          value={range}
          onChange={(event) => setRange(event.target.value)}
          aria-label="Filter by date range"
          icon={<CalendarIcon className="h-4 w-4" />}
          className="sm:w-48"
        >
          {Object.entries(RANGES).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          aria-label="Filter by account"
          icon={<InstagramIcon className="h-4 w-4" />}
          className="sm:w-56"
        >
          <option value="all">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              @{account.handle}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Conversations started"
          value={view.total}
          tone="indigo"
          icon={<ChartIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Completed"
          value={view.completed}
          tone="green"
          icon={<CheckIcon className="h-5 w-5" />}
          corner={view.completionRate !== null ? `${view.completionRate}%` : undefined}
        />
        <StatCard
          label="Still active"
          value={view.active}
          tone="amber"
          icon={<ClockIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Emails collected"
          value={view.emails}
          tone="blue"
          icon={<MailIcon className="h-5 w-5" />}
        />
      </div>

      {view.total === 0 ? (
        <EmptyState
          icon={<ChartIcon className="h-6 w-6" />}
          title="Nothing to chart in this period"
          description="Try a wider date range, or check back once your DM flows start replying to comments."
        />
      ) : (
        <>
          <FlowStepFunnel funnel={view.funnel} total={view.total} />
          <FlowLeaderboard rows={view.leaderboard} />
        </>
      )}
    </div>
  );
}
