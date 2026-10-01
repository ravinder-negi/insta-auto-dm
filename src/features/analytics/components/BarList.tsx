"use client";

import type { ReactNode } from "react";
import { ChartEmpty } from "@/features/analytics/components/chart-primitives";

export interface BarListRow {
  key: string;
  label: string;
  value: number;
  /** `critical` paints the reserved failure colour; it always ships with the
   *  icon and label beside it, never carrying the meaning on its own. */
  tone?: "default" | "critical";
  icon?: ReactNode;
}

/**
 * A handful of labelled magnitudes. Plain HTML rather than a plotted chart:
 * at this count the label *is* the axis, every value is written out, and the
 * row can carry an icon that an SVG category tick cannot.
 */
export function BarList({
  rows,
  emptyMessage,
}: {
  rows: BarListRow[];
  emptyMessage: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (total === 0) return <ChartEmpty message={emptyMessage} />;

  const peak = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
              {row.icon}
              <span className="truncate">{row.label}</span>
            </span>
            <span className="shrink-0 text-sm">
              <span className="font-semibold tabular-nums">
                {row.value.toLocaleString("en-US")}
              </span>
              <span className="ml-1.5 text-xs text-zinc-400 tabular-nums">
                {Math.round((row.value / total) * 100)}%
              </span>
            </span>
          </div>

          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-brand-100/70 dark:bg-white/8">
            <div
              className="h-full rounded-r-[4px]"
              style={{
                width: `${Math.max(1, (row.value / peak) * 100)}%`,
                backgroundColor:
                  row.tone === "critical"
                    ? "var(--viz-critical)"
                    : "var(--viz-series-1)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
