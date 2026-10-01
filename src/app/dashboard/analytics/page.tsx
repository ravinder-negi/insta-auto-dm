import { createClient } from "@/lib/supabase/server";
import type { ApiUsage } from "@/types";
import { ApiUsageCard } from "@/features/analytics/components/ApiUsageCard";
import { AnalyticsDashboard } from "@/features/analytics/components/AnalyticsDashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { currentTimestamp } from "@/lib/utils/format";
import { ChartIcon } from "@/components/icons";
import {
  EMPTY_ROLLUP,
  WINDOW_DAYS,
  type AnalyticsRollup,
} from "@/features/analytics/lib/metrics";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // One pre-aggregated window; every range and account filter is applied in
  // the browser against it. See supabase/migrations/..._analytics_rollup.sql.
  const [{ data: rollupData, error }, { data: apiUsage }] = await Promise.all([
    supabase.rpc("analytics_rollup", { p_days: WINDOW_DAYS }),
    supabase
      .from("api_usage")
      .select("call_count, total_cputime, total_time, updated_at")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const rollup = (rollupData as AnalyticsRollup | null) ?? EMPTY_ROLLUP;

  const usageRow = apiUsage as Pick<
    ApiUsage,
    "call_count" | "total_cputime" | "total_time" | "updated_at"
  > | null;
  // A freshly-seeded row (no DM sent yet) has all three usage fields null.
  const hasUsageData =
    usageRow !== null &&
    (usageRow.call_count !== null ||
      usageRow.total_cputime !== null ||
      usageRow.total_time !== null);
  const usagePercent = hasUsageData
    ? Math.max(
        usageRow!.call_count ?? 0,
        usageRow!.total_cputime ?? 0,
        usageRow!.total_time ?? 0
      )
    : null;
  const usageUpdatedAt = hasUsageData ? usageRow!.updated_at : null;

  const hasActivity =
    rollup.executions.length > 0 ||
    rollup.leads.length > 0 ||
    rollup.follows.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Insights"
        title={
          <>
            Your automation <span className="brand-text-gradient">performance</span>
          </>
        }
        description="DMs delivered, emails captured and followers won — and which AutoDMs earn them."
      />

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
          {error.message}
        </p>
      )}

      <ApiUsageCard
        percent={usagePercent}
        updatedAt={usageUpdatedAt}
        now={currentTimestamp()}
      />

      {hasActivity ? (
        <AnalyticsDashboard rollup={rollup} now={currentTimestamp()} />
      ) : (
        <EmptyState
          icon={<ChartIcon className="h-6 w-6" />}
          title="Nothing to chart yet"
          description="Analytics fill in once your AutoDMs start replying to comments."
        />
      )}
    </div>
  );
}
