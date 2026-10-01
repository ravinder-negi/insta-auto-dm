"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RulePerformance } from "@/features/analytics/lib/metrics";
import { compactNumber } from "@/features/analytics/lib/metrics";
import {
  AXIS_TICK,
  ChartEmpty,
  ChartTooltip,
  GRID_STROKE,
} from "@/features/analytics/components/chart-primitives";

const MAX_BARS = 8;
const NAME_LIMIT = 22;

/**
 * Which AutoDMs actually pull their weight, ranked by delivered DMs.
 *
 * One series, so no legend — the title says what is plotted — and one hue:
 * length already carries the magnitude. Every bar is direct-labelled at the
 * tip, so no value depends on hovering.
 */
export function TopRulesChart({ rows }: { rows: RulePerformance[] }) {
  const data = [...rows]
    .sort((a, b) => b.dmsSent - a.dmsSent || b.triggers - a.triggers)
    .slice(0, MAX_BARS)
    .filter((row) => row.dmsSent > 0)
    // Recharts draws a vertical bar chart bottom-up, so reverse to put the
    // leader at the top.
    .reverse()
    .map((row) => ({
      name:
        row.name.length > NAME_LIMIT
          ? `${row.name.slice(0, NAME_LIMIT - 1)}…`
          : row.name,
      fullName: row.name,
      value: row.dmsSent,
    }));

  if (data.length === 0) {
    return <ChartEmpty message="No AutoDM has delivered a DM in this period." />;
  }

  return (
    // Fills the card so a short list doesn't leave dead space beside the
    // taller stack next to it; barSize keeps the marks thin regardless.
    <div
      className="h-full"
      style={{ minHeight: Math.max(200, data.length * 40 + 24) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 44, bottom: 0, left: 0 }}
          barCategoryGap="28%"
        >
          <XAxis
            type="number"
            hide
            allowDecimals={false}
            tickFormatter={compactNumber}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
          />
          <Tooltip
            cursor={{ fill: GRID_STROKE, fillOpacity: 0.6 }}
            content={<ChartTooltip keyShape="rect" />}
          />
          <Bar
            dataKey="value"
            name="DMs sent"
            fill="var(--viz-series-1)"
            barSize={14}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              fill="var(--viz-muted)"
              fontSize={11}
              formatter={(value) => compactNumber(Number(value ?? 0))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
