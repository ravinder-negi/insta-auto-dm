"use client";

import { formatDate, formatRelative, formatTime } from "@/lib/utils/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface FlowSessionRow {
  id: string;
  ig_sender_id: string;
  current_step_order: number;
  status: string;
  started_at: string;
  last_interaction_at: string;
}

const HEAD_CLASS =
  "px-5 py-3 text-left text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase";

function StepProgress({
  current,
  total,
}: {
  current: number;
  total: number | null;
}) {
  if (!total) return <span className="text-zinc-500">Step {current}</span>;
  return (
    <span className="text-zinc-500">
      Step {current} / {total}
    </span>
  );
}

export function FlowSessionsTable({
  sessions,
  totalSteps,
  now,
}: {
  sessions: FlowSessionRow[];
  totalSteps: number | null;
  now: number;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:hidden">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="truncate font-mono text-sm font-medium">
                {session.ig_sender_id}
              </p>
              <StatusBadge status={session.status} />
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              <StepProgress current={session.current_step_order} total={totalSteps} />
            </p>

            <p className="mt-2 text-xs text-zinc-400">
              Last active {formatRelative(session.last_interaction_at, now)}
            </p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:block dark:border-white/8 dark:bg-white/4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-black/6 bg-zinc-50/70 dark:border-white/8 dark:bg-white/3">
              <tr>
                <th className={HEAD_CLASS}>Sender</th>
                <th className={HEAD_CLASS}>Progress</th>
                <th className={HEAD_CLASS}>Status</th>
                <th className={HEAD_CLASS}>Started</th>
                <th className={HEAD_CLASS}>Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 dark:divide-white/8">
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/3"
                >
                  <td className="px-5 py-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {session.ig_sender_id}
                  </td>
                  <td className="px-5 py-4">
                    <StepProgress current={session.current_step_order} total={totalSteps} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="text-zinc-600 dark:text-zinc-300">
                      {formatDate(session.started_at)}
                    </p>
                    <p className="text-xs text-zinc-400">{formatTime(session.started_at)}</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-zinc-500">
                    {formatRelative(session.last_interaction_at, now)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
