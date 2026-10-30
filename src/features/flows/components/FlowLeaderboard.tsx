"use client";

import { useMemo, useState } from "react";
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

const HEAD_CLASS = "px-4 py-3 text-left text-[11px] font-bold tracking-[0.08em] text-[var(--muted-soft)] uppercase";

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
    <section className="viz flex flex-col gap-4 rounded-[30px] border-[1.5px] border-[var(--line)] bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-extrabold tracking-[-0.01em]">Flow leaderboard</h2>
          <p className="m-0 mt-1 text-sm text-[var(--muted)]">
            Every flow that started a conversation in this period.
          </p>
        </div>
        <div className="focus-within:border-[var(--primary)] flex min-w-[220px] items-center gap-2.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 transition-colors sm:w-72">
          <SearchIcon className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" />
          <input
            type="search"
            aria-label="Search by flow or account"
            placeholder="Search by flow or account…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-[46px] w-full border-0 bg-transparent text-sm outline-none placeholder:text-[var(--muted-soft)]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border-[1.5px] border-[var(--line)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b-[1.5px] border-[var(--line)] bg-[var(--bg)]">
              <tr>
                <th className={HEAD_CLASS}>Flow</th>
                <th className={`${HEAD_CLASS} text-right`}>Started</th>
                <th className={`${HEAD_CLASS} text-right`}>Completed</th>
                <th className={`${HEAD_CLASS} text-right`}>Active</th>
                <th className={`${HEAD_CLASS} text-right`}>Emails</th>
                <th className={`${HEAD_CLASS} text-right`}>Completion</th>
              </tr>
            </thead>

            <tbody className="divide-y-[1.5px] divide-[var(--line)]">
              {visible.map((row) => {
                const completionRate =
                  row.started > 0 ? Math.round((row.completed / row.started) * 100) : 0;
                return (
                  <tr key={row.flowId} className="transition-colors hover:bg-[var(--bg)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="max-w-[220px] truncate font-semibold">{row.name}</span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={
                            row.isActive
                              ? { backgroundColor: "var(--success-tint)", color: "var(--success-text)" }
                              : { backgroundColor: "var(--neutral-tint)", color: "var(--neutral-text)" }
                          }
                        >
                          {row.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="m-0 mt-0.5 truncate text-xs text-[var(--muted-soft)]">@{row.accountHandle}</p>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <span aria-hidden className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-[var(--neutral-tint)] sm:block">
                          <span
                            className="block h-full rounded-r-[4px]"
                            style={{
                              width: `${Math.max(2, (row.started / peak) * 100)}%`,
                              backgroundColor: "var(--viz-series-1)",
                            }}
                          />
                        </span>
                        <span className="font-bold tabular-nums">{row.started.toLocaleString("en-US")}</span>
                      </div>
                    </td>

                    <NumberCell value={row.completed} />
                    <NumberCell value={row.active} />
                    <NumberCell value={row.emails} />

                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{completionRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-[var(--muted)]">
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
      {value > 0 ? value.toLocaleString("en-US") : <span className="text-[var(--muted-soft)]">0</span>}
    </td>
  );
}
