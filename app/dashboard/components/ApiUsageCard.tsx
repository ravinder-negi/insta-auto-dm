import { AlertIcon, ChartIcon } from "./icons";
import { formatRelative } from "./format";

type UsageStatus = "normal" | "elevated" | "high";

const STATUS_STYLES: Record<
  UsageStatus,
  { label: string; bar: string; chip: string }
> = {
  normal: {
    label: "Normal",
    bar: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  elevated: {
    label: "Elevated",
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  high: {
    label: "High",
    bar: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  },
};

// Meta doesn't publish a fixed request cap — these bands are just severity
// labels layered on the percentage Graph API already reports (0-100), not a
// hardcoded limit of our own.
function statusFor(percent: number): UsageStatus {
  if (percent >= 80) return "high";
  if (percent >= 50) return "elevated";
  return "normal";
}

export function ApiUsageCard({
  percent,
  updatedAt,
  now,
}: {
  /** Max of Meta's call_count/total_cputime/total_time, already 0-100. */
  percent: number | null;
  updatedAt: string | null;
  now: number;
}) {
  if (percent === null || updatedAt === null) {
    return (
      <div className="rounded-2xl border border-black/6 bg-white p-4 dark:border-white/8 dark:bg-white/4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ChartIcon className="h-4 w-4 text-zinc-400" />
          Instagram API usage
        </p>
        <p className="mt-1.5 text-xs text-zinc-500">
          No usage data yet — this fills in once your first automated reply
          sends.
        </p>
      </div>
    );
  }

  const status = statusFor(percent);
  const style = STATUS_STYLES[status];

  return (
    <div className="rounded-2xl border border-black/6 bg-white p-4 dark:border-white/8 dark:bg-white/4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {status === "high" ? (
            <AlertIcon className="h-4 w-4 text-rose-500" />
          ) : (
            <ChartIcon className="h-4 w-4 text-zinc-400" />
          )}
          Instagram API usage
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.chip}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.bar}`} />
          {style.label}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${style.bar}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        {percent}% of Meta&apos;s current rate limit used · updated{" "}
        {formatRelative(updatedAt, now)}
      </p>

      {status === "high" && (
        <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
          Approaching Instagram&apos;s API limit — new DMs may be delayed or
          fail until usage drops.
        </p>
      )}
    </div>
  );
}
