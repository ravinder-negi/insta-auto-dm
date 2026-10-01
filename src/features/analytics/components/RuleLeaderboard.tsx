"use client";

import { useMemo, useState } from "react";
import { SearchField } from "@/components/ui/controls";
import { ChartIcon, SearchIcon } from "@/components/icons";
import type { RulePerformance } from "@/features/analytics/lib/metrics";

type SortKey =
  | "name"
  | "triggers"
  | "dmsSent"
  | "emails"
  | "followers"
  | "failed"
  | "conversion";

const COLUMNS: {
  key: SortKey;
  label: string;
  numeric: boolean;
  title?: string;
}[] = [
  { key: "name", label: "AutoDM", numeric: false },
  { key: "triggers", label: "Triggered", numeric: true, title: "Matching comments picked up" },
  { key: "dmsSent", label: "DMs sent", numeric: true, title: "Primary DMs delivered" },
  { key: "emails", label: "Emails", numeric: true, title: "Addresses captured by this rule" },
  { key: "followers", label: "Followers", numeric: true, title: "Follow nudges that converted" },
  { key: "failed", label: "Failed", numeric: true, title: "Sends Instagram rejected" },
  { key: "conversion", label: "Conversion", numeric: true, title: "Delivered DMs ÷ triggers" },
];

const HEAD_CLASS =
  "px-4 py-3 text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase";

/**
 * The table view for the whole dashboard: every number the charts above plot
 * is readable here without hovering, which is also what lets the lighter
 * series colours ship.
 */
export function RuleLeaderboard({ rows }: { rows: RulePerformance[] }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: "dmsSent",
    desc: true,
  });
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((row) =>
          `${row.name} ${row.accountHandle} ${row.keywords.join(" ")}`
            .toLowerCase()
            .includes(needle)
        )
      : rows;

    return [...filtered].sort((a, b) => {
      const direction = sort.desc ? -1 : 1;
      if (sort.key === "name") return a.name.localeCompare(b.name) * direction;
      return (a[sort.key] - b[sort.key]) * direction;
    });
  }, [rows, query, sort]);

  const peak = Math.max(1, ...rows.map((row) => row.dmsSent));

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, desc: !current.desc }
        : { key, desc: key !== "name" }
    );

  return (
    <section className="viz flex flex-col gap-4 rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            AutoDM leaderboard
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Every rule that fired in this period. Click a column to re-rank.
          </p>
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by rule, keyword or account..."
          className="sm:w-72"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-black/6 dark:border-white/8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-black/6 bg-zinc-50/70 dark:border-white/8 dark:bg-white/3">
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    title={column.title}
                    aria-sort={
                      sort.key === column.key
                        ? sort.desc
                          ? "descending"
                          : "ascending"
                        : "none"
                    }
                    className={`${HEAD_CLASS} ${
                      column.numeric ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200 ${
                        sort.key === column.key
                          ? "text-zinc-700 dark:text-zinc-200"
                          : ""
                      }`}
                    >
                      {column.label}
                      <span aria-hidden className="text-[10px]">
                        {sort.key === column.key
                          ? sort.desc
                            ? "▾"
                            : "▴"
                          : ""}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-black/6 dark:divide-white/8">
              {visible.map((row) => (
                <tr
                  key={row.ruleId}
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
                      {row.keywords.length > 0 &&
                        ` · ${row.keywords.slice(0, 3).join(", ")}`}
                    </p>
                  </td>

                  <NumberCell value={row.triggers} />

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <span
                        aria-hidden
                        className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-brand-100/70 sm:block dark:bg-white/8"
                      >
                        <span
                          className="block h-full rounded-r-[4px]"
                          style={{
                            width: `${Math.max(2, (row.dmsSent / peak) * 100)}%`,
                            backgroundColor: "var(--viz-series-1)",
                          }}
                        />
                      </span>
                      <span className="font-semibold tabular-nums">
                        {row.dmsSent.toLocaleString("en-US")}
                      </span>
                    </div>
                  </td>

                  <NumberCell value={row.emails} />
                  <NumberCell value={row.followers} />

                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.failed > 0 ? (
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        {row.failed.toLocaleString("en-US")}
                      </span>
                    ) : (
                      <span className="text-zinc-400">0</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {row.conversion}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-zinc-500">
            {rows.length === 0 ? (
              <>
                <ChartIcon className="h-4 w-4" />
                No AutoDM fired in this period.
              </>
            ) : (
              <>
                <SearchIcon className="h-4 w-4" />
                No rule matches your search.
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
