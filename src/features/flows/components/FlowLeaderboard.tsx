"use client";

import { useMemo, useState } from "react";
import { SearchField } from "@/components/ui/controls";
import { ChartIcon, SearchIcon } from "@/components/icons";

export interface FlowPerformance {
  flowId: string;
  name: string;
  accountHandle: string;
  isActive: boolean;
  started: number;
  completed: number;
  active: number;
  emails: number;
}

const HEAD_CLASS =
  "px-4 py-3 text-left text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase";

/** The table view for the flows analytics page — every number the funnel
 *  and stat cards summarize, broken out per flow. */
export function FlowLeaderboard({ rows }: { rows: FlowPerformance[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((row) =>
          `${row.name} ${row.accountHandle}`.toLowerCase().includes(needle)
        )
      : rows;
    return [...filtered].sort((a, b) => b.started - a.started);
  }, [rows, query]);

  const peak = Math.max(1, ...rows.map((row) => row.started));

  return (
    <section className="viz flex flex-col gap-4 rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Flow leaderboard
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Every flow that started a conversation in this period.
          </p>
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by flow or account..."
          className="sm:w-72"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-black/6 dark:border-white/8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-black/6 bg-zinc-50/70 dark:border-white/8 dark:bg-white/3">
              <tr>
                <th className={HEAD_CLASS}>Flow</th>
                <th className={`${HEAD_CLASS} text-right`}>Started</th>
                <th className={`${HEAD_CLASS} text-right`}>Completed</th>
                <th className={`${HEAD_CLASS} text-right`}>Active</th>
                <th className={`${HEAD_CLASS} text-right`}>Emails</th>
                <th className={`${HEAD_CLASS} text-right`}>Completion</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/6 dark:divide-white/8">
              {visible.map((row) => {
                const completionRate =
                  row.started > 0
                    ? Math.round((row.completed / row.started) * 100)
                    : 0;
                return (
                  <tr
                    key={row.flowId}
                    className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/3"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="max-w-[220px] truncate font-medium">
                          {row.name}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            row.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                          }`}
                        >
                          {row.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">
                        @{row.accountHandle}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <span
                          aria-hidden
                          className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-brand-100/70 sm:block dark:bg-white/8"
                        >
                          <span
                            className="block h-full rounded-r-[4px]"
                            style={{
                              width: `${Math.max(2, (row.started / peak) * 100)}%`,
                              backgroundColor: "var(--viz-series-1)",
                            }}
                          />
                        </span>
                        <span className="font-semibold tabular-nums">
                          {row.started.toLocaleString("en-US")}
                        </span>
                      </div>
                    </td>

                    <NumberCell value={row.completed} />
                    <NumberCell value={row.active} />
                    <NumberCell value={row.emails} />

                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {completionRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-zinc-500">
            {rows.length === 0 ? (
              <>
                <ChartIcon className="h-4 w-4" />
                No flow started a conversation in this period.
              </>
            ) : (
              <>
                <SearchIcon className="h-4 w-4" />
                No flow matches your search.
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}

function NumberCell({ value }: { value: number }) {
  return (
    <td className="px-4 py-3 text-right tabular-nums">
      {value > 0 ? (
        value.toLocaleString("en-US")
      ) : (
        <span className="text-zinc-400">0</span>
      )}
    </td>
  );
}
