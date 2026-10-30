import { AlertIcon, ChartIcon } from "@/components/icons";
import { formatRelative } from "@/lib/utils/format";

type UsageStatus = "normal" | "elevated" | "high";

const STATUS_STYLES: Record<UsageStatus, { label: string; bar: string; bg: string; fg: string }> = {
  normal: { label: "Normal", bar: "var(--success)", bg: "var(--success-tint)", fg: "var(--success-text)" },
  elevated: { label: "Elevated", bar: "var(--warning)", bg: "var(--warning-tint)", fg: "var(--warning-text)" },
  high: { label: "High", bar: "var(--danger)", bg: "var(--danger-tint)", fg: "var(--danger-deep)" },
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
      <div className="rounded-[26px] border-[1.5px] border-[var(--line)] bg-white p-5">
        <p className="m-0 flex items-center gap-2 text-sm font-bold">
          <ChartIcon className="h-4 w-4 text-[var(--muted-soft)]" />
          Instagram API usage
        </p>
        <p className="m-0 mt-1.5 text-xs text-[var(--muted)]">
          No usage data yet — this fills in once your first automated reply sends.
        </p>
      </div>
    );
  }

  const status = statusFor(percent);
  const style = STATUS_STYLES[status];

  return (
    <div className="rounded-[26px] border-[1.5px] border-[var(--line)] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 flex items-center gap-2 text-sm font-bold">
          {status === "high" ? (
            <AlertIcon className="h-4 w-4 text-[var(--primary)]" />
          ) : (
            <ChartIcon className="h-4 w-4 text-[var(--muted-soft)]" />
          )}
          Instagram API usage
        </p>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
          style={{ backgroundColor: style.bg, color: style.fg }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.bar }} />
          {style.label}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--neutral-tint)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, percent)}%`, backgroundColor: style.bar }}
        />
      </div>

      <p className="m-0 mt-2 text-xs text-[var(--muted)]">
        {percent}% of Meta&apos;s current rate limit used · updated {formatRelative(updatedAt, now)}
      </p>

      {status === "high" && (
        <p className="m-0 mt-2 text-xs font-semibold text-[var(--primary)]">
          Approaching Instagram&apos;s API limit — new DMs may be delayed or fail until usage drops.
        </p>
      )}
    </div>
  );
}
