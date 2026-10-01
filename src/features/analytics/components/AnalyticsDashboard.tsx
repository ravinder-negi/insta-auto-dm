"use client";

import { useMemo, useState } from "react";
import { SelectField } from "@/components/ui/controls";
import { StatCard } from "@/components/ui/StatCard";
import {
  AlertIcon,
  CalendarIcon,
  ChartIcon,
  InstagramIcon,
  MailIcon,
  SendIcon,
  TrendingIcon,
  UsersIcon,
} from "@/components/icons";
import { BarList } from "@/features/analytics/components/BarList";
import { ChartCard } from "@/features/analytics/components/chart-primitives";
import { PerformanceTrendChart } from "@/features/analytics/components/PerformanceTrendChart";
import { RuleLeaderboard } from "@/features/analytics/components/RuleLeaderboard";
import { TopRulesChart } from "@/features/analytics/components/TopRulesChart";
import {
  RANGES,
  type AnalyticsRollup,
  compactNumber,
  dailySeries,
  dayWindow,
  leadSourceBreakdown,
  rulePerformance,
  sliceRollup,
  statusBreakdown,
  totalsFor,
  trendFor,
} from "@/features/analytics/lib/metrics";

/**
 * Filters sit in one row above everything and scope every card below them,
 * so the tiles, the charts and the table always describe the same slice.
 */
export function AnalyticsDashboard({
  rollup,
  now,
}: {
  rollup: AnalyticsRollup;
  /** Captured on the server so the window is stable across hydration. */
  now: number;
}) {
  const [range, setRange] = useState("30");
  const [accountId, setAccountId] = useState("all");

  const view = useMemo(() => {
    const days = RANGES[range].days;
    const window = dayWindow(now, days);
    const previousWindow = dayWindow(now, days, days);

    const slice = sliceRollup(rollup, window, accountId);
    const previous = sliceRollup(rollup, previousWindow, accountId);

    return {
      days,
      totals: totalsFor(slice),
      previousTotals: totalsFor(previous),
      series: dailySeries(slice, window),
      rules: rulePerformance(rollup, slice),
      statuses: statusBreakdown(slice),
      leadSources: leadSourceBreakdown(slice),
    };
  }, [rollup, range, accountId, now]);

  const { totals, previousTotals } = view;
  const rangeLabel = RANGES[range].label.toLowerCase();

  // Follows are only attributable through the per-rule follow gate, so with
  // the gate off everywhere the tile can only ever read zero — say so rather
  // than leaving the reader to wonder.
  const followGateOn = rollup.rules.some((rule) => rule.requiresFollow);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SelectField
          value={range}
          onChange={(event) => setRange(event.target.value)}
          aria-label="Filter by date range"
          icon={<CalendarIcon className="h-4 w-4" />}
          className="sm:w-48"
        >
          {Object.entries(RANGES).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          aria-label="Filter by account"
          icon={<InstagramIcon className="h-4 w-4" />}
          className="sm:w-56"
        >
          <option value="all">All accounts</option>
          {rollup.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              @{account.handle}
            </option>
          ))}
        </SelectField>

        <p className="text-xs text-zinc-400 sm:ml-auto">
          {compactNumber(totals.triggers)} comments picked up {rangeLabel}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="DMs sent"
          value={compactNumber(totals.dmsSent)}
          tone="indigo"
          icon={<SendIcon className="h-5 w-5" />}
          trend={trendFor(totals.dmsSent, previousTotals.dmsSent)}
        />
        <StatCard
          label="Emails collected"
          value={compactNumber(totals.emails)}
          tone="amber"
          icon={<MailIcon className="h-5 w-5" />}
          trend={trendFor(totals.emails, previousTotals.emails)}
        />
        <StatCard
          label="Followers gained"
          value={compactNumber(totals.followers)}
          tone="green"
          icon={<UsersIcon className="h-5 w-5" />}
          trend={trendFor(totals.followers, previousTotals.followers)}
        />
        <StatCard
          label="Delivery success rate"
          value={`${totals.successRate}%`}
          tone="blue"
          icon={<TrendingIcon className="h-5 w-5" />}
          trend={trendFor(totals.successRate, previousTotals.successRate)}
        />
      </div>

      <ChartCard
        title="Performance over time"
        description={`DMs delivered, emails captured and follows won per day, ${rangeLabel}.`}
      >
        <PerformanceTrendChart data={view.series} />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Top AutoDMs"
          description="Your best-performing rules by DMs delivered."
        >
          <TopRulesChart rows={view.rules} />
        </ChartCard>

        <div className="flex flex-col gap-4">
          <ChartCard
            title="What happened"
            description="Every outcome a matching comment reached."
          >
            <BarList
              emptyMessage="No AutoDM fired in this period."
              rows={view.statuses.map((row) => ({
                key: row.status,
                label: row.label,
                value: row.value,
                tone: row.status === "failed" ? "critical" : "default",
                icon:
                  row.status === "failed" ? (
                    <AlertIcon className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                  ) : undefined,
              }))}
            />
          </ChartCard>

          <ChartCard
            title="Where emails come from"
            description={
              accountId === "all"
                ? "Across every capture point."
                : "Link-in-bio captures are profile-wide and aren't shown per account."
            }
          >
            <BarList
              emptyMessage="No addresses captured in this period."
              rows={view.leadSources.map((row) => ({
                key: row.source,
                label: row.label,
                value: row.value,
              }))}
            />
          </ChartCard>
        </div>
      </div>

      <RuleLeaderboard rows={view.rules} />

      <p className="flex items-start gap-1.5 text-xs text-zinc-400">
        <ChartIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Days are bucketed in UTC. &ldquo;Followers gained&rdquo; counts
          commenters a follow-gated AutoDM nudged who were found following on a
          later trigger
          {followGateOn
            ? "."
            : " — no AutoDM has the follow gate switched on yet, so it stays at zero."}
        </span>
      </p>
    </div>
  );
}
