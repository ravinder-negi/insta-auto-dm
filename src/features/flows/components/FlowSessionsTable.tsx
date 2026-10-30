"use client";

import { useMemo, useState } from "react";
import { StatusChip } from "@/components/ui/LinkInBioCollection";
import { formatDate, formatRelative, formatTime } from "@/lib/utils/format";
import { SearchIcon } from "@/components/icons";

export interface FlowSessionRow {
  id: string;
  flowName: string;
  ig_sender_id: string;
  current_step_order: number;
  totalSteps: number | null;
  status: string;
  started_at: string;
  last_interaction_at: string;
}

type StatusFilter = "all" | "active" | "completed" | "expired";

const STATUS_META: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  active: { label: "Active", bg: "var(--warning-tint)", fg: "var(--warning-text)", dot: "var(--warning)" },
  completed: { label: "Completed", bg: "var(--success-tint)", fg: "var(--success-text)", dot: "var(--success)" },
  expired: { label: "Expired", bg: "var(--neutral-tint)", fg: "var(--neutral-text)", dot: "var(--neutral-dot)" },
};

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, bg: "var(--neutral-tint)", fg: "var(--neutral-text)", dot: "var(--neutral-dot)" };
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

function StepProgress({ current, total }: { current: number; total: number | null }) {
  const pct = total ? Math.min(100, Math.round((current / total) * 100)) : null;
  return (
    <div className="flex items-center gap-2.5">
      {pct !== null && (
        <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--line)]">
          <span className="block h-full rounded-full bg-[var(--violet)]" style={{ width: `${pct}%` }} />
        </span>
      )}
      <span className="shrink-0 text-xs font-semibold text-[var(--muted)]">
        {total ? `Step ${current} / ${total}` : `Step ${current}`}
      </span>
    </div>
  );
}

export function FlowSessionsTable({ sessions, now }: { sessions: FlowSessionRow[]; now: number }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: sessions.length,
      active: sessions.filter((session) => session.status === "active").length,
      completed: sessions.filter((session) => session.status === "completed").length,
      expired: sessions.filter((session) => session.status === "expired").length,
    }),
    [sessions]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sessions.filter((session) => {
      if (status !== "all" && session.status !== status) return false;
      if (!needle) return true;
      return `${session.flowName} ${session.ig_sender_id}`.toLowerCase().includes(needle);
    });
  }, [sessions, status, query]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2.5">
          <StatusChip label="All" dot="var(--neutral-dot)" count={counts.all} active={status === "all"} onClick={() => setStatus("all")} />
          <StatusChip
            label="Active"
            dot="var(--warning)"
            count={counts.active}
            active={status === "active"}
            onClick={() => setStatus("active")}
          />
          <StatusChip
            label="Completed"
            dot="var(--success)"
            count={counts.completed}
            active={status === "completed"}
            onClick={() => setStatus("completed")}
          />
          <StatusChip
            label="Expired"
            dot="var(--neutral-dot)"
            count={counts.expired}
            active={status === "expired"}
            onClick={() => setStatus("expired")}
          />
        </div>

        <div className="focus-within:border-[var(--primary)] flex min-w-[220px] items-center gap-2.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 transition-colors">
          <SearchIcon className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" />
          <input
            type="search"
            aria-label="Search by flow or sender"
            placeholder="Search by flow or sender…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-[46px] w-full border-0 bg-transparent text-sm outline-none placeholder:text-[var(--muted-soft)]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="flex items-center justify-center gap-2 rounded-[30px] border-[1.5px] border-[var(--line)] bg-white px-5 py-14 text-sm text-[var(--muted)]">
          <SearchIcon className="h-4 w-4" />
          No conversations match the current filters.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-2 rounded-[24px] border-[1.5px] border-[var(--line)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="m-0 truncate font-mono text-sm font-semibold">{session.ig_sender_id}</p>
                  <StatusPill status={session.status} />
                </div>
                <p className="m-0 truncate text-xs text-[var(--muted-soft)]">{session.flowName}</p>
                <StepProgress current={session.current_step_order} total={session.totalSteps} />
                <p className="m-0 text-xs text-[var(--muted-soft)]">
                  Last active {formatRelative(session.last_interaction_at, now)}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[30px] border-[1.5px] border-[var(--line)] bg-white sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b-[1.5px] border-[var(--line)] bg-[var(--bg)]">
                  <tr>
                    <th className={HEAD_CLASS}>Flow</th>
                    <th className={HEAD_CLASS}>Sender</th>
                    <th className={HEAD_CLASS}>Progress</th>
                    <th className={HEAD_CLASS}>Status</th>
                    <th className={HEAD_CLASS}>Started</th>
                    <th className={HEAD_CLASS}>Last active</th>
                  </tr>
                </thead>
                <tbody className="divide-y-[1.5px] divide-[var(--line)]">
                  {filtered.map((session) => (
                    <tr key={session.id} className="transition-colors hover:bg-[var(--bg)]">
                      <td className="px-5 py-4 text-[var(--muted)]">{session.flowName}</td>
                      <td className="px-5 py-4 font-mono text-xs font-semibold">{session.ig_sender_id}</td>
                      <td className="px-5 py-4">
                        <StepProgress current={session.current_step_order} total={session.totalSteps} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill status={session.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="m-0">{formatDate(session.started_at)}</p>
                        <p className="m-0 text-xs text-[var(--muted-soft)]">{formatTime(session.started_at)}</p>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted-soft)] whitespace-nowrap">
                        {formatRelative(session.last_interaction_at, now)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const HEAD_CLASS = "px-5 py-3 text-left text-[11px] font-bold tracking-[0.08em] text-[var(--muted-soft)] uppercase";
