import { createClient } from "@/lib/supabase/server";
import type { ApiUsage } from "@/lib/types";
import { ApiUsageCard } from "../components/ApiUsageCard";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { currentTimestamp, formatDate } from "../components/format";
import { AlertIcon, ChartIcon, SendIcon, TrendingIcon } from "../components/icons";

const DAYS = 14;

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const since = new Date(currentTimestamp() - DAYS * 86_400_000).toISOString();
  const [{ data, error }, { data: apiUsage }] = await Promise.all([
    supabase
      .from("automation_executions")
      .select("status, created_at, automation_rule_id")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("api_usage")
      .select("call_count, total_cputime, total_time, updated_at")
      .eq("id", 1)
      .maybeSingle(),
  ]);

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

  const executions = data ?? [];
  const sent = executions.filter((row) => row.status === "sent").length;
  const failed = executions.filter((row) => row.status === "failed").length;
  const successRate =
    executions.length > 0 ? Math.round((sent / executions.length) * 100) : 0;

  // One bucket per day, oldest first, keyed by local calendar day.
  const buckets = Array.from({ length: DAYS }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (DAYS - 1 - index));
    return { day, total: 0 };
  });

  for (const row of executions) {
    const stamp = new Date(row.created_at);
    stamp.setHours(0, 0, 0, 0);
    const bucket = buckets.find(
      (candidate) => candidate.day.getTime() === stamp.getTime()
    );
    if (bucket) bucket.total += 1;
  }

  const peak = Math.max(1, ...buckets.map((bucket) => bucket.total));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Insights"
        title={
          <>
            Your automation <span className="brand-text-gradient">performance</span>
          </>
        }
        description={`Replies sent over the last ${DAYS} days.`}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Executions (${DAYS}d)`}
          value={executions.length}
          tone="indigo"
          icon={<ChartIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Replies sent"
          value={sent}
          tone="green"
          icon={<SendIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Failed"
          value={failed}
          tone="red"
          icon={<AlertIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Success rate"
          value={`${successRate}%`}
          tone="blue"
          icon={<TrendingIcon className="h-5 w-5" />}
        />
      </div>

      {executions.length === 0 ? (
        <EmptyState
          icon={<ChartIcon className="h-6 w-6" />}
          title="Nothing to chart yet"
          description="Analytics fill in once your rules start replying to comments."
        />
      ) : (
        <section className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
          <h2 className="text-base font-semibold tracking-tight">Daily activity</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Executions per day, {formatDate(buckets[0].day)} – today.
          </p>

          <div className="mt-6 flex h-48 items-end gap-1.5">
            {buckets.map((bucket) => (
              <div
                key={bucket.day.toISOString()}
                className="group flex h-full flex-1 flex-col justify-end"
                title={`${formatDate(bucket.day)}: ${bucket.total}`}
              >
                <div
                  className="brand-gradient w-full rounded-t-md transition-opacity group-hover:opacity-80"
                  style={{
                    height: `${Math.max(2, (bucket.total / peak) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
            <span>{formatDate(buckets[0].day)}</span>
            <span>{formatDate(buckets[buckets.length - 1].day)}</span>
          </div>
        </section>
      )}
    </div>
  );
}
