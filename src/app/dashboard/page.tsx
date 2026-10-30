import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentTimestamp } from "@/lib/utils/format";
import {
  EMPTY_ROLLUP,
  dayWindow,
  rulePerformance,
  sliceRollup,
  totalsFor,
  type AnalyticsRollup,
} from "@/features/analytics/lib/metrics";
import {
  attentionItems,
  gettingStarted,
  groupFailures,
  recentLeads,
  type HomeAccount,
  type RecentLead,
} from "@/features/home/lib/summary";
import { HomeHero } from "@/features/home/components/HomeHero";
import {
  GettingStarted,
  NeedsAttention,
  RecentLeads,
  TopAutoDms,
} from "@/features/home/components/HomeSections";

const WEEK_DAYS = 7;
const DAY_MS = 86_400_000;

// Many-to-one joins come back as a single object (or null if deleted).
type RuleLeadRow = { email: string; collected_at: string; automation_rule_id: string; automation_rules: { name: string } | null };
type FlowLeadRow = { email: string; collected_at: string; flow_id: string; dm_flows: { name: string } | null };
type MagnetLeadRow = { email: string; created_at: string; lead_magnet_id: string; lead_magnets: { title: string } | null };

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = currentTimestamp();
  // Rolling 7 days for raw timestamps; the rollup below uses the same UTC
  // day buckets as the analytics pages, so its numbers match theirs.
  const weekAgo = new Date(now - WEEK_DAYS * DAY_MS).toISOString();
  const countOnly = { count: "exact", head: true } as const;

  const [
    { data: profile },
    { data: accountRows },
    { data: rollupData },
    { data: ruleRows },
    { data: flowRows },
    { data: failedRows },
    { count: everRan },
    { count: flowLeadsThisWeek },
    { count: clicksThisWeek },
    { data: ruleLeadRows },
    { data: flowLeadRows },
    { data: magnetLeadRows },
  ] = await Promise.all([
    supabase.from("profiles").select("display_name, username, is_published").eq("id", user.id).maybeSingle(),
    supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id, is_active, token_status")
      .order("created_at", { ascending: true }),
    supabase.rpc("analytics_rollup", { p_days: WEEK_DAYS }),
    supabase.from("automation_rules").select("id, instagram_account_id, is_active"),
    supabase.from("dm_flows").select("id, instagram_account_id, is_active"),
    supabase
      .from("automation_executions")
      .select("error_message")
      .eq("status", "failed")
      .gte("created_at", weekAgo)
      .limit(500),
    supabase.from("automation_executions").select("id", countOnly).limit(1),
    supabase.from("dm_flow_leads").select("id", countOnly).gte("collected_at", weekAgo),
    supabase.from("link_clicks").select("id", countOnly).eq("profile_id", user.id).gte("created_at", weekAgo),
    supabase
      .from("automation_rule_leads")
      .select("email, collected_at, automation_rule_id, automation_rules(name)")
      .order("collected_at", { ascending: false })
      .limit(6)
      .returns<RuleLeadRow[]>(),
    supabase
      .from("dm_flow_leads")
      .select("email, collected_at, flow_id, dm_flows(name)")
      .order("collected_at", { ascending: false })
      .limit(6)
      .returns<FlowLeadRow[]>(),
    supabase
      .from("lead_magnet_leads")
      .select("email, created_at, lead_magnet_id, lead_magnets(title)")
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<MagnetLeadRow[]>(),
  ]);

  const accounts: HomeAccount[] = (accountRows ?? []).map((account) => ({
    id: account.id,
    handle: account.username ?? account.instagram_user_id,
    isActive: account.is_active,
    tokenExpired: account.token_status === "expired",
  }));

  // ---- this week's numbers, shown in the hero
  const rollup = (rollupData as AnalyticsRollup | null) ?? EMPTY_ROLLUP;
  const thisWeek = sliceRollup(rollup, dayWindow(now, WEEK_DAYS), "all");
  const current = totalsFor(thisWeek);
  const leadsNow = current.emails + (flowLeadsThisWeek ?? 0);

  // ---- needs attention
  const activeAutomationsByAccount = new Map<string, number>();
  for (const row of [...(ruleRows ?? []), ...(flowRows ?? [])]) {
    if (!row.is_active || !row.instagram_account_id) continue;
    activeAutomationsByAccount.set(
      row.instagram_account_id,
      (activeAutomationsByAccount.get(row.instagram_account_id) ?? 0) + 1
    );
  }
  const attention = attentionItems({
    accounts,
    failures: groupFailures((failedRows ?? []).map((row) => row.error_message)),
    activeAutomationsByAccount,
  });

  // ---- lists
  const topAutoDms = rulePerformance(rollup, thisWeek)
    .filter((row) => row.dmsSent > 0)
    .sort((a, b) => b.dmsSent - a.dmsSent)
    .slice(0, 5);

  const leads = recentLeads([
    (ruleLeadRows ?? []).map(
      (row): RecentLead => ({
        email: row.email,
        source: `AutoDM: ${row.automation_rules?.name ?? "deleted"}`,
        collectedAt: row.collected_at,
        href: `/dashboard/rules/${row.automation_rule_id}/leads`,
      })
    ),
    (flowLeadRows ?? []).map(
      (row): RecentLead => ({
        email: row.email,
        source: `DM Flow: ${row.dm_flows?.name ?? "deleted"}`,
        collectedAt: row.collected_at,
        href: `/dashboard/flows/${row.flow_id}/leads`,
      })
    ),
    (magnetLeadRows ?? []).map(
      (row): RecentLead => ({
        email: row.email,
        source: `Lead magnet: ${row.lead_magnets?.title ?? "deleted"}`,
        collectedAt: row.created_at,
        href: `/dashboard/lead-magnets/${row.lead_magnet_id}/leads`,
      })
    ),
  ]);

  const checklist = gettingStarted({
    accountCount: accounts.length,
    automationCount: (ruleRows ?? []).length + (flowRows ?? []).length,
    hasActivity: (everRan ?? 0) > 0,
  });

  const firstName = profile?.display_name?.trim().split(/\s+/)[0];
  const publicProfile = profile?.is_published && profile.username ? `/${profile.username}` : null;

  return (
    <div className="flex flex-col gap-8">
      <HomeHero
        firstName={firstName}
        delivered={current.dmsSent}
        failed={current.failed}
        leads={leadsNow}
        clicks={clicksThisWeek ?? 0}
        publicProfileHref={publicProfile}
      />

      {checklist && <GettingStarted steps={checklist} />}

      <NeedsAttention items={attention} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopAutoDms rows={topAutoDms} />
        <RecentLeads leads={leads} now={now} />
      </div>
    </div>
  );
}
