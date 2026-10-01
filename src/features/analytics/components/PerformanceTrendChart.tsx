"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayPoint } from "@/features/analytics/lib/metrics";
import { compactNumber } from "@/features/analytics/lib/metrics";
import {
  AXIS_STROKE,
  AXIS_TICK,
  ChartEmpty,
  ChartTooltip,
  GRID_STROKE,
  SURFACE,
} from "@/features/analytics/components/chart-primitives";

const SERIES = [
  { key: "dms", name: "DMs sent", color: "var(--viz-series-1)" },
  { key: "emails", name: "Emails collected", color: "var(--viz-series-2)" },
  { key: "followers", name: "Followers gained", color: "var(--viz-series-3)" },
] as const;

/**
 * Three counts on one axis over time.
 *
 * Identity never rests on hue alone: the legend below carries each series'
 * period total beside its stroke key, the tooltip lists all three at the
 * hovered day, and the leaderboard underneath is the table view. End-labels
 * are deliberately left off — these three lines converge near zero on quiet
 * days, and stacked labels there read as noise.
 */
export function PerformanceTrendChart({ data }: { data: DayPoint[] }) {
  const hasData = data.some(
    (point) => point.dms > 0 || point.emails > 0 || point.followers > 0
  );

  if (!hasData) {
    return (
      <ChartEmpty message="No DMs, emails or follows in this period yet." />
    );
  }

  const totals = {
    dms: data.reduce((sum, point) => sum + point.dms, 0),
    emails: data.reduce((sum, point) => sum + point.emails, 0),
    followers: data.reduce((sum, point) => sum + point.followers, 0),
  };

  return (
    <div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeWidth={1} />
            <XAxis
              dataKey="label"
              // Always label both ends; recharts drops the ones in between
              // that would collide.
              interval="preserveStartEnd"
              minTickGap={28}
              tickLine={false}
              axisLine={{ stroke: AXIS_STROKE }}
              tick={AXIS_TICK}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              width={48}
              tickFormatter={compactNumber}
            />
            <Tooltip
              cursor={{ stroke: AXIS_STROKE, strokeWidth: 1 }}
              content={<ChartTooltip keyShape="line" />}
            />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                stroke={series.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}
                // Marks paint immediately: a draw-on animation delays the
                // read, and it never settles in print or screenshot capture.
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-black/6 pt-4 dark:border-white/8">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2 text-sm">
            <span
              className="h-0.5 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            <span className="font-semibold tabular-nums">
              {totals[series.key].toLocaleString("en-US")}
            </span>
            <span className="text-zinc-500">{series.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
