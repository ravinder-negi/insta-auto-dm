import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ApiUsage } from "@/types";
import { ApiUsageCard } from "@/features/analytics/components/ApiUsageCard";
import { AnalyticsDashboard } from "@/features/analytics/components/AnalyticsDashboard";
import { currentTimestamp } from "@/lib/utils/format";
import { ArrowLeftIcon, ChartIcon } from "@/components/icons";
import {
  EMPTY_ROLLUP,
  WINDOW_DAYS,
  type AnalyticsRollup,
} from "@/features/analytics/lib/metrics";
import { displayFont, linkInBioCssVars, linkInBioWrapperClass } from "@/lib/linkInBioTheme";

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
    <div className={linkInBioWrapperClass} style={linkInBioCssVars}>
      <div className="flex flex-col gap-7">
        <Link
          href="/dashboard/rules"
          className="inline-flex w-fit items-center gap-2 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--secondary-soft-bg)]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to AutoDMs
        </Link>

        {/* hero */}
        <div className="relative overflow-hidden rounded-[40px] border border-[var(--line)] bg-white bg-[radial-gradient(#DDD6EC_1.2px,transparent_1.2px)] bg-[length:30px_30px]">
          <div
            className="animate-float pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full opacity-70 blur-[90px]"
            style={{ background: "var(--tint)" }}
          />
          <div
            className="animate-float-delayed pointer-events-none absolute -top-20 -right-24 h-[420px] w-[420px] rounded-full opacity-80 blur-[100px]"
            style={{ background: "var(--secondary-pale-border)" }}
          />
          <div className="relative flex flex-col gap-3.5 p-9 sm:p-11">
            <span className="animate-fade-in-up inline-flex w-fit items-center gap-2.5 rounded-full border border-[var(--line)] bg-white py-[7px] pr-4 pl-3 text-xs font-bold tracking-[0.1em] text-[var(--muted)] uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
              </span>
              Automation
            </span>
            <h1
              className={`animate-fade-in-up m-0 ${displayFont} text-[clamp(32px,4.2vw,48px)] leading-[1.03] font-extrabold tracking-[-0.035em]`}
              style={{ animationDelay: "0.1s" }}
            >
              Your automation{" "}
              <span className="relative inline-block text-[var(--accent)]">
                performance
                <svg
                  className="absolute bottom-[-6px] left-0 h-3.5 w-full"
                  viewBox="0 0 200 14"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9 C 40 2, 90 14, 198 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p
              className="animate-fade-in-up m-0 max-w-[540px] text-lg text-[var(--muted)]"
              style={{ animationDelay: "0.2s" }}
            >
              DMs delivered, emails captured and followers won — and which AutoDMs earn them.
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-2xl border-[1.5px] border-[var(--danger-border)] bg-[var(--danger-tint-faint)] px-4 py-3 text-sm font-semibold text-[var(--danger-deep)]"
          >
            {error.message}
          </p>
        )}

        <ApiUsageCard percent={usagePercent} updatedAt={usageUpdatedAt} now={currentTimestamp()} />

        {hasActivity ? (
          <AnalyticsDashboard rollup={rollup} now={currentTimestamp()} />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-[36px] border-[1.5px] border-dashed border-[var(--secondary-border)] bg-[var(--secondary-faint-bg)] px-7 py-14 text-center">
            <span className="animate-float flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[var(--violet)] text-white">
              <ChartIcon className="h-[34px] w-[34px]" />
            </span>
            <h3 className={`m-0 ${displayFont} text-[28px] font-extrabold tracking-[-0.03em]`}>
              Nothing to chart yet
            </h3>
            <p className="m-0 max-w-[380px] text-[var(--muted)]">
              Analytics fill in once your AutoDMs start replying to comments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
