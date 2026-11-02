/**
 * "Top posts & reels": which pieces of content trigger the most AutoDMs.
 * Shaped from the `media_rollup` RPC the same way metrics.ts shapes
 * `analytics_rollup`: day buckets filtered by range and account locally.
 */
import type { DayWindow } from "./metrics";

/** The rule's trigger_type: what the media id points at. */
export type MediaKind = "comment_keyword" | "story_reply" | "live_comment" | string;

export interface MediaExecutionBucket {
  day: string;
  mediaId: string;
  accountId: string | null;
  kind: MediaKind;
  status: string;
  count: number;
}

export interface MediaLeadBucket {
  day: string;
  mediaId: string;
  accountId: string | null;
  count: number;
}

/** Exactly the shape `media_rollup` returns. */
export interface MediaRollup {
  executions: MediaExecutionBucket[];
  leads: MediaLeadBucket[];
}

export const EMPTY_MEDIA_ROLLUP: MediaRollup = { executions: [], leads: [] };

/** What Instagram tells us about a post, when it could be loaded. */
export interface MediaDetails {
  caption: string | null;
  mediaType: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
}

export interface MediaPerformance {
  mediaId: string;
  accountId: string | null;
  kind: MediaKind;
  /** Comments (or story replies) that matched an AutoDM. */
  triggers: number;
  dmsSent: number;
  failed: number;
  leads: number;
  /** Share of triggers that ended in a delivered DM. */
  conversion: number;
}

export function mediaPerformance(
  rollup: MediaRollup,
  window: DayWindow,
  accountId: string
): MediaPerformance[] {
  const inScope = (row: { day: string; accountId: string | null }) =>
    row.day >= window.from &&
    row.day <= window.to &&
    (accountId === "all" || row.accountId === accountId);

  const rows = new Map<string, MediaPerformance>();
  const rowFor = (mediaId: string, accountId: string | null, kind: MediaKind) => {
    let row = rows.get(mediaId);
    if (!row) {
      row = { mediaId, accountId, kind, triggers: 0, dmsSent: 0, failed: 0, leads: 0, conversion: 0 };
      rows.set(mediaId, row);
    }
    // Executions of a since-deleted account row lose their account id; the
    // same post's other buckets still say which account owns it.
    row.accountId ??= accountId;
    return row;
  };

  for (const bucket of rollup.executions) {
    if (!inScope(bucket)) continue;
    const row = rowFor(bucket.mediaId, bucket.accountId, bucket.kind);
    row.triggers += bucket.count;
    if (bucket.status === "sent") row.dmsSent += bucket.count;
    if (bucket.status === "failed") row.failed += bucket.count;
  }

  // A lead only counts toward media that also triggered in this slice.
  for (const bucket of rollup.leads) {
    if (!inScope(bucket)) continue;
    const row = rows.get(bucket.mediaId);
    if (row) row.leads += bucket.count;
  }

  for (const row of rows.values()) {
    row.conversion = row.triggers > 0 ? Math.round((row.dmsSent / row.triggers) * 100) : 0;
  }

  return [...rows.values()].sort(
    (a, b) => b.dmsSent - a.dmsSent || b.triggers - a.triggers || b.leads - a.leads
  );
}

/**
 * Post/reel ids worth loading details for, busiest first. Stories and Lives
 * are skipped: Instagram stops serving them soon after they end.
 */
export function mediaToDescribe(rollup: MediaRollup, limit: number) {
  const totals = new Map<string, { accountId: string | null; triggers: number }>();
  for (const bucket of rollup.executions) {
    if (bucket.kind !== "comment_keyword") continue;
    const entry = totals.get(bucket.mediaId) ?? { accountId: bucket.accountId, triggers: 0 };
    entry.accountId ??= bucket.accountId;
    entry.triggers += bucket.count;
    totals.set(bucket.mediaId, entry);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1].triggers - a[1].triggers)
    .slice(0, limit)
    .map(([mediaId, { accountId }]) => ({ mediaId, accountId }));
}
