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

const TILE_TONES = {
  violet: { bg: "var(--tint2)", fg: "#3B3560", icon: "var(--violet)" },
  amber: { bg: "var(--warning-tint)", fg: "var(--warning-text)", icon: "var(--warning)" },
  green: { bg: "var(--success-tint)", fg: "var(--success-text)", icon: "var(--success)" },
  pink: { bg: "var(--tint)", fg: "var(--primary-deep)", icon: "var(--primary)" },
} as const;

/** Stat tile shared by the AutoDM and flow analytics dashboards — a tinted
 *  pill-cornered card, in place of the generic app-wide `StatCard`. */
export function StatTile({
  label,
  value,
  icon,
  tone,
  trend,
  corner,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: keyof typeof TILE_TONES;
  trend?: { label: string; caption?: string; tone?: "up" | "down" | "flat" };
  /** Small plain-text note in place of a trend pill, e.g. a completion rate. */
  corner?: string;
}) {
  const colors = TILE_TONES[tone];
  const trendUp = trend?.tone === "up";
  const trendDown = trend?.tone === "down";

  return (
    <div
      className="flex flex-col gap-4 rounded-[26px] p-5 transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_28px_46px_-30px_color-mix(in srgb, var(--violet) 40%, transparent)]"
      style={{ backgroundColor: colors.bg }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white" style={{ color: colors.icon }}>
          {icon}
        </span>
        {trend ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{
              backgroundColor: trendUp ? "var(--success)" : trendDown ? "var(--primary)" : "#ffffff",
              color: trendUp || trendDown ? "#ffffff" : "var(--muted)",
            }}
          >
            {trend.label}
          </span>
        ) : (
          corner && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold" style={{ color: colors.icon }}>
              {corner}
            </span>
          )
        )}
      </div>
      <div>
        <p className="m-0 text-[28px] leading-none font-extrabold tracking-[-0.02em]">{value}</p>
        <p className="m-0 mt-2 truncate text-sm font-semibold" style={{ color: colors.fg }}>
          {label}
        </p>
      </div>
    </div>
  );
}

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
      className={`viz flex flex-col rounded-[30px] border-[1.5px] border-[var(--line)] bg-white p-6 transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-[var(--secondary-border)] hover:shadow-[0_28px_46px_-30px_color-mix(in srgb, var(--violet) 50%, transparent)] ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-extrabold tracking-[-0.01em]">{title}</h2>
          {description && <p className="m-0 mt-1 text-sm text-[var(--muted)]">{description}</p>}
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
    <div className="pointer-events-none rounded-2xl border-[1.5px] border-[var(--line)] bg-white px-3.5 py-2.5 shadow-[0_24px_50px_-16px_color-mix(in srgb, var(--ink) 30%, transparent)]">
      {label !== undefined && (
        <p className="m-0 text-[11px] font-bold tracking-[0.08em] text-[var(--muted-soft)] uppercase">
          {String(label)}
        </p>
      )}
      <ul className="m-0 mt-1.5 flex flex-col gap-1 p-0">
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
            <span className="font-bold tabular-nums">
              {Number(entry.value ?? 0).toLocaleString("en-US")}
            </span>
            <span className="text-[var(--muted)]">{String(entry.name ?? "")}</span>
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
    <ul className="m-0 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 p-0 pt-3">
      {payload.map((entry) => (
        <li
          key={String(entry.dataKey ?? entry.value)}
          className="flex items-center gap-2 text-xs text-[var(--muted)]"
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
    <p className="flex h-full min-h-40 items-center justify-center text-center text-sm text-[var(--muted-soft)]">
      {message}
    </p>
  );
}
