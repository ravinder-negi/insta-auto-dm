/**
 * Shaping for the analytics dashboard.
 *
 * The server calls the `analytics_rollup` RPC once for a 180-day window and
 * hands the browser pre-aggregated day buckets. Every filter then runs
 * locally against that slice, so switching range or account is instant and
 * the numbers stay correct no matter how many executions the account has
 * (counting raw rows in JS could not — PostgREST caps responses at 1000).
 *
 * Days are UTC throughout, matching how the RPC buckets them, and every
 * label is formatted with `timeZone: "UTC"` so the axis can't drift a day.
 */

/** How much history the RPC returns. Twice the longest range, so the longest
 *  range still has a full previous period to compare against. */
export const WINDOW_DAYS = 180;

export const DAY_MS = 86_400_000;

export const RANGES: Record<string, { label: string; days: number }> = {
  "7": { label: "Last 7 days", days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
};

export type LeadSource = "rule" | "link";

export interface AnalyticsAccount {
  id: string;
  handle: string;
}

export interface AnalyticsRule {
  id: string;
  name: string;
  accountId: string;
  isActive: boolean;
  keywords: string[];
  requiresFollow: boolean;
  collectsEmail: boolean;
}

/** One (day, rule, status) bucket — `count` is how many executions it holds. */
export interface ExecutionBucket {
  day: string;
  ruleId: string | null;
  accountId: string | null;
  status: string;
  count: number;
}

export interface LeadBucket {
  day: string;
  source: LeadSource;
  ruleId: string | null;
  accountId: string | null;
  count: number;
}

export interface FollowBucket {
  day: string;
  ruleId: string;
  accountId: string | null;
  count: number;
}

/** Exactly the shape `analytics_rollup` returns. */
export interface AnalyticsRollup {
  accounts: AnalyticsAccount[];
  rules: AnalyticsRule[];
  executions: ExecutionBucket[];
  leads: LeadBucket[];
  follows: FollowBucket[];
}

export const EMPTY_ROLLUP: AnalyticsRollup = {
  accounts: [],
  rules: [],
  executions: [],
  leads: [],
  follows: [],
};

export const STATUS_LABELS: Record<string, string> = {
  sent: "DM delivered",
  follow_prompt_sent: "Follow nudge sent",
  email_prompt_sent: "Email ask sent",
  scheduled: "Scheduled",
  processing: "Processing",
  skipped_already_prompted: "Skipped — already nudged",
  failed: "Failed",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  rule: "AutoDM email ask",
  link: "Link-in-bio magnet",
};

/* ------------------------------------------------------------------ days */

export function utcDayKey(value: number | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function dayKeyToMs(key: string) {
  return Date.parse(`${key}T00:00:00Z`);
}

/** "Oct 1" — UTC-formatted so it matches the bucket it labels. */
export function formatDayLabel(key: string) {
  return new Date(dayKeyToMs(key)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export interface DayWindow {
  /** Inclusive, "YYYY-MM-DD". ISO dates compare correctly as strings. */
  from: string;
  to: string;
  days: string[];
}

/**
 * The `days`-long window ending `offsetDays` before today. `offsetDays: 0` is
 * the current period; passing the range length gives the one before it.
 */
export function dayWindow(now: number, days: number, offsetDays = 0): DayWindow {
  const endMs = dayKeyToMs(utcDayKey(now)) - offsetDays * DAY_MS;
  const keys = Array.from({ length: days }, (_, index) =>
    utcDayKey(endMs - (days - 1 - index) * DAY_MS)
  );
  return { from: keys[0], to: keys[keys.length - 1], days: keys };
}

/* --------------------------------------------------------------- slicing */

export interface Slice {
  executions: ExecutionBucket[];
  leads: LeadBucket[];
  follows: FollowBucket[];
}

/**
 * Everything inside the window for the selected account. `accountId` of "all"
 * keeps link-in-bio leads; a specific account drops them, since those captures
 * are profile-wide and can't be attributed to one Instagram account.
 */
export function sliceRollup(
  rollup: AnalyticsRollup,
  window: DayWindow,
  accountId: string
): Slice {
  const inWindow = (day: string) => day >= window.from && day <= window.to;
  const matchesAccount = (rowAccountId: string | null) =>
    accountId === "all" || rowAccountId === accountId;

  return {
    executions: rollup.executions.filter(
      (row) => inWindow(row.day) && matchesAccount(row.accountId)
    ),
    leads: rollup.leads.filter(
      (row) => inWindow(row.day) && matchesAccount(row.accountId)
    ),
    follows: rollup.follows.filter(
      (row) => inWindow(row.day) && matchesAccount(row.accountId)
    ),
  };
}

function sum<T>(rows: T[], pick: (row: T) => number) {
  return rows.reduce((total, row) => total + pick(row), 0);
}

/* ---------------------------------------------------------------- totals */

export interface Totals {
  dmsSent: number;
  emails: number;
  followers: number;
  triggers: number;
  failed: number;
  successRate: number;
}

export function totalsFor(slice: Slice): Totals {
  const dmsSent = sum(
    slice.executions.filter((row) => row.status === "sent"),
    (row) => row.count
  );
  const failed = sum(
    slice.executions.filter((row) => row.status === "failed"),
    (row) => row.count
  );

  return {
    dmsSent,
    emails: sum(slice.leads, (row) => row.count),
    followers: sum(slice.follows, (row) => row.count),
    triggers: sum(slice.executions, (row) => row.count),
    failed,
    // Of the runs that reached a send decision, how many landed. Nudges and
    // skips are deliberately outside this ratio — they never attempted a DM.
    successRate:
      dmsSent + failed > 0 ? Math.round((dmsSent / (dmsSent + failed)) * 100) : 0,
  };
}

/** 1,284 / 12.9K / 3.4M — stat tiles and axis ticks share this. */
export function compactNumber(value: number) {
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(value) >= 10_000)
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return value.toLocaleString("en-US");
}

/** Signed change, or `undefined` when the prior period had nothing to compare
 *  against — "↑ ∞%" off a zero baseline is noise, not a trend. */
export function trendFor(current: number, previous: number) {
  if (previous === 0) return undefined;
  const change = Math.round(((current - previous) / previous) * 100);
  return {
    label: `${change > 0 ? "↑" : change < 0 ? "↓" : "→"} ${Math.abs(change)}%`,
    caption: "vs previous period",
    tone: change > 0 ? "up" : change < 0 ? "down" : "flat",
  } as const;
}

/* ---------------------------------------------------------------- series */

export interface DayPoint {
  day: string;
  label: string;
  dms: number;
  emails: number;
  followers: number;
}

/** One point per day across the window, oldest first, gaps filled with zeros. */
export function dailySeries(slice: Slice, window: DayWindow): DayPoint[] {
  const points = new Map<string, DayPoint>(
    window.days.map((day) => [
      day,
      { day, label: formatDayLabel(day), dms: 0, emails: 0, followers: 0 },
    ])
  );

  for (const row of slice.executions) {
    if (row.status !== "sent") continue;
    const point = points.get(row.day);
    if (point) point.dms += row.count;
  }
  for (const row of slice.leads) {
    const point = points.get(row.day);
    if (point) point.emails += row.count;
  }
  for (const row of slice.follows) {
    const point = points.get(row.day);
    if (point) point.followers += row.count;
  }

  return [...points.values()];
}

/* ----------------------------------------------------------- leaderboard */

export interface RulePerformance {
  ruleId: string;
  name: string;
  accountHandle: string;
  isActive: boolean;
  keywords: string[];
  triggers: number;
  dmsSent: number;
  failed: number;
  emails: number;
  followers: number;
  /** Share of this rule's triggers that ended in a delivered DM. */
  conversion: number;
}

export function rulePerformance(
  rollup: AnalyticsRollup,
  slice: Slice
): RulePerformance[] {
  const handles = new Map(rollup.accounts.map((a) => [a.id, a.handle]));
  const rows = new Map<string, RulePerformance>(
    rollup.rules.map((rule) => [
      rule.id,
      {
        ruleId: rule.id,
        name: rule.name,
        accountHandle: handles.get(rule.accountId) ?? "unknown",
        isActive: rule.isActive,
        keywords: rule.keywords ?? [],
        triggers: 0,
        dmsSent: 0,
        failed: 0,
        emails: 0,
        followers: 0,
        conversion: 0,
      },
    ])
  );

  for (const bucket of slice.executions) {
    const row = bucket.ruleId ? rows.get(bucket.ruleId) : undefined;
    if (!row) continue;
    row.triggers += bucket.count;
    if (bucket.status === "sent") row.dmsSent += bucket.count;
    if (bucket.status === "failed") row.failed += bucket.count;
  }
  for (const bucket of slice.leads) {
    const row = bucket.ruleId ? rows.get(bucket.ruleId) : undefined;
    if (row) row.emails += bucket.count;
  }
  for (const bucket of slice.follows) {
    const row = rows.get(bucket.ruleId);
    if (row) row.followers += bucket.count;
  }

  for (const row of rows.values()) {
    row.conversion =
      row.triggers > 0 ? Math.round((row.dmsSent / row.triggers) * 100) : 0;
  }

  // A rule that never fired in the window has nothing to rank.
  return [...rows.values()].filter((row) => row.triggers > 0);
}

/* -------------------------------------------------------------- breakdowns */

export function statusBreakdown(slice: Slice) {
  const counts = new Map<string, number>();
  for (const bucket of slice.executions) {
    counts.set(bucket.status, (counts.get(bucket.status) ?? 0) + bucket.count);
  }
  return [...counts.entries()]
    .map(([status, value]) => ({
      status,
      label: STATUS_LABELS[status] ?? status,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

export function leadSourceBreakdown(slice: Slice) {
  const order: LeadSource[] = ["rule", "link"];
  const counts = new Map<LeadSource, number>(order.map((key) => [key, 0]));
  for (const bucket of slice.leads) {
    counts.set(bucket.source, (counts.get(bucket.source) ?? 0) + bucket.count);
  }
  return order.map((source) => ({
    source,
    label: LEAD_SOURCE_LABELS[source],
    value: counts.get(source) ?? 0,
  }));
}
