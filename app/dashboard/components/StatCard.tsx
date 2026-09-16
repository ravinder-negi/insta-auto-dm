import type { ReactNode } from "react";

const TONES = {
  indigo: {
    tile: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
    corner: "text-indigo-400 dark:text-indigo-400/70",
  },
  green: {
    tile: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    corner: "text-emerald-400 dark:text-emerald-400/70",
  },
  amber: {
    tile: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    corner: "text-amber-400 dark:text-amber-400/70",
  },
  red: {
    tile: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    corner: "text-rose-400 dark:text-rose-400/70",
  },
  blue: {
    tile: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
    corner: "text-sky-400 dark:text-sky-400/70",
  },
  zinc: {
    tile: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    corner: "text-zinc-300 dark:text-zinc-600",
  },
};

export function StatCard({
  label,
  value,
  icon,
  tone = "indigo",
  trend,
  corner,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: keyof typeof TONES;
  /** Small pill in the top-right, e.g. "↑ 100%" with a caption under it. */
  trend?: { label: string; caption?: string };
  /** Tinted glyph in the top-right, used when there is no trend to show. */
  corner?: ReactNode;
}) {
  const toneStyles = TONES[tone];

  return (
    <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.06)] transition-shadow duration-200 hover:shadow-[0_8px_24px_-12px_rgba(16,24,40,0.25)] dark:border-white/8 dark:bg-white/4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneStyles.tile}`}
          >
            {icon}
          </span>
          <p className="text-2xl leading-none font-bold tracking-tight">
            {value}
          </p>
        </div>

        {trend ? (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {trend.label}
            </span>
            {trend.caption && (
              <p className="mt-1 text-[11px] text-zinc-400">{trend.caption}</p>
            )}
          </div>
        ) : (
          corner && <span className={toneStyles.corner}>{corner}</span>
        )}
      </div>

      <p className="mt-3 truncate text-sm text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </div>
  );
}
