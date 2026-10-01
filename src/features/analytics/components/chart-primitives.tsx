"use client";

import type { ReactNode } from "react";

/**
 * Shared chart chrome. Colours come from the `--viz-*` custom properties
 * defined in globals.css, so every mark re-reads the right value when the
 * theme flips — there is no JS theme detection anywhere in the chart layer.
 */

export const AXIS_TICK = { fill: "var(--viz-muted)", fontSize: 11 } as const;
export const GRID_STROKE = "var(--viz-grid)";
export const AXIS_STROKE = "var(--viz-axis)";
export const SURFACE = "var(--viz-surface)";

/** Card shell every chart sits in. `.viz` is what scopes the colour tokens. */
export function ChartCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`viz flex flex-col rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-6 flex-1">{children}</div>
    </section>
  );
}

export interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
}

/**
 * One tooltip listing every series at the hovered X. The value leads and the
 * series name follows — the reader already knows which series they want.
 * Names go in as text nodes, never as markup.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  keyShape = "line",
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  /** Mirror the mark: a stroke for lines, a swatch for bars. */
  keyShape?: "line" | "rect";
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="pointer-events-none rounded-xl border border-black/8 bg-white px-3 py-2.5 shadow-lg dark:border-white/12 dark:bg-zinc-900">
      {label !== undefined && (
        <p className="text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
          {String(label)}
        </p>
      )}
      <ul className="mt-1.5 flex flex-col gap-1">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey ?? entry.name)}
            className="flex items-center gap-2 text-sm"
          >
            {keyShape === "line" ? (
              <span
                className="h-0.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            ) : (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="font-semibold tabular-nums">
              {Number(entry.value ?? 0).toLocaleString("en-US")}
            </span>
            <span className="text-zinc-500">{String(entry.name ?? "")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface LegendEntry {
  value?: string | number;
  color?: string;
  dataKey?: string | number;
}

/** Legend keyed with line strokes, matching the marks it describes. */
export function ChartLegend({ payload }: { payload?: LegendEntry[] }) {
  if (!payload?.length) return null;

  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-3">
      {payload.map((entry) => (
        <li
          key={String(entry.dataKey ?? entry.value)}
          className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <span
            className="h-0.5 w-4 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {String(entry.value ?? "")}
        </li>
      ))}
    </ul>
  );
}

/** Shown in place of a plot when the current filters match nothing. */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <p className="flex h-full min-h-40 items-center justify-center text-center text-sm text-zinc-400">
      {message}
    </p>
  );
}
