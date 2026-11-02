"use client";

import {
  CameraIcon,
  ExternalLinkIcon,
  ImageIcon,
  LayersIcon,
  VideoCameraIcon,
} from "@/components/icons";
import { ChartCard } from "@/features/analytics/components/chart-primitives";
import { compactNumber } from "@/features/analytics/lib/metrics";
import type { MediaDetails, MediaPerformance } from "@/features/analytics/lib/mediaMetrics";

const VISIBLE_ROWS = 8;

function kindLabel(row: MediaPerformance, details: MediaDetails | null | undefined) {
  if (row.kind === "story_reply") return "Story";
  if (row.kind === "live_comment") return "Live";
  const type = details?.mediaType?.toUpperCase();
  if (type === "VIDEO" || type === "REELS" || type === "REEL") return "Reel";
  if (type === "CAROUSEL_ALBUM") return "Carousel";
  return "Post";
}

function KindIcon({ label }: { label: string }) {
  const className = "h-5 w-5";
  if (label === "Reel" || label === "Live") return <VideoCameraIcon className={className} />;
  if (label === "Carousel") return <LayersIcon className={className} />;
  if (label === "Story") return <CameraIcon className={className} />;
  return <ImageIcon className={className} />;
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex w-[64px] shrink-0 flex-col items-end leading-tight">
      <span className="text-sm font-extrabold">{value}</span>
      <span className="text-[11px] font-semibold text-[var(--muted)]">{label}</span>
    </span>
  );
}

/** Which posts, reels, stories and Lives trigger the most AutoDMs. */
export function TopMediaCard({
  rows,
  details,
  accountHandles,
  rangeLabel,
}: {
  rows: MediaPerformance[];
  details: Record<string, MediaDetails | null>;
  accountHandles: Map<string, string>;
  rangeLabel: string;
}) {
  const visible = rows.slice(0, VISIBLE_ROWS);

  return (
    <ChartCard
      title="Top posts & reels"
      description={`The content that triggered the most AutoDMs, ${rangeLabel}.`}
    >
      {visible.length === 0 ? (
        <p className="m-0 text-sm text-[var(--muted)]">
          No comments on your posts, reels, stories or Lives triggered an AutoDM in this period.
        </p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {visible.map((row, index) => {
            const info = details[row.mediaId];
            const label = kindLabel(row, info);
            const handle = row.accountId ? accountHandles.get(row.accountId) : undefined;
            const title =
              info?.caption?.trim().split("\n")[0] ||
              (label === "Story" || label === "Live"
                ? `${label} (no longer on Instagram)`
                : `${label} (details unavailable)`);

            return (
              <li
                key={row.mediaId}
                className="flex items-center gap-3.5 rounded-2xl p-2 transition-colors hover:bg-[var(--bg)]"
              >
                <span className="w-5 shrink-0 text-center text-xs font-extrabold text-[var(--muted-soft)]">
                  {index + 1}
                </span>
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--tint2)] text-[var(--violet)]">
                  {info?.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN URL, no next/image domain config
                    <img src={info.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <KindIcon label={label} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{title}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span className="rounded-full bg-[var(--tint2)] px-2 py-0.5 text-[11px] font-bold text-[var(--violet)]">
                      {label}
                    </span>
                    {handle && <span className="hidden truncate sm:inline">@{handle}</span>}
                    {info?.permalink && (
                      <a
                        href={info.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[var(--primary)] hover:underline"
                      >
                        Open
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  <Metric value={compactNumber(row.triggers)} label="triggers" />
                  <Metric value={compactNumber(row.dmsSent)} label="DMs sent" />
                  <Metric value={compactNumber(row.leads)} label="leads" />
                  <Metric value={`${row.conversion}%`} label="delivered" />
                </span>
                <span className="flex flex-col items-end leading-tight sm:hidden">
                  <span className="text-sm font-extrabold">{compactNumber(row.dmsSent)}</span>
                  <span className="text-[11px] font-semibold text-[var(--muted)]">DMs</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </ChartCard>
  );
}
