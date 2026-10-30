import { createClient } from "@/lib/supabase/server";
import type { InstagramAccount } from "@/types";
import { currentTimestamp } from "@/lib/utils/format";
import { AccountsHero } from "@/features/accounts/components/AccountsHero";
import { AccountsList, type AccountRow } from "@/features/accounts/components/AccountsList";
import { fetchInstagramProfileStats } from "@/lib/instagram/profile";

export default async function AccountsPage(
  props: PageProps<"/dashboard/accounts">
) {
  const searchParams = await props.searchParams;
  const errorParam = searchParams.error;
  const connectError = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  const supabase = await createClient();

  const [{ data, error }, { data: activity }, { count: repliesSent }, { data: ruleRows }, { data: flowRows }] =
    await Promise.all([
      supabase
        .from("instagram_accounts")
        .select("id, instagram_user_id, username, is_active, token_status, created_at, access_token")
        .order("created_at", { ascending: false }),
      // Newest first, so the first row seen for an account is its last activity.
      supabase
        .from("automation_executions")
        .select("instagram_account_id, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("automation_executions")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent"),
      supabase.from("automation_rules").select("instagram_account_id, is_active"),
      supabase.from("dm_flows").select("instagram_account_id, is_active"),
    ]);

  const lastActivity = new Map<string, string>();
  for (const row of activity ?? []) {
    if (row.instagram_account_id && !lastActivity.has(row.instagram_account_id)) {
      lastActivity.set(row.instagram_account_id, row.created_at);
    }
  }

  function countByAccount(rows: { instagram_account_id: string | null; is_active: boolean }[] | null) {
    const counts = new Map<string, { total: number; active: number }>();
    for (const row of rows ?? []) {
      if (!row.instagram_account_id) continue;
      const entry = counts.get(row.instagram_account_id) ?? { total: 0, active: 0 };
      entry.total += 1;
      if (row.is_active) entry.active += 1;
      counts.set(row.instagram_account_id, entry);
    }
    return counts;
  }

  const ruleCounts = countByAccount(ruleRows);
  const flowCounts = countByAccount(flowRows);

  const rows = (data ?? []) as Pick<
    InstagramAccount,
    "id" | "instagram_user_id" | "username" | "is_active" | "token_status" | "created_at" | "access_token"
  >[];

  const profileStats = await Promise.all(
    rows.map((account) => fetchInstagramProfileStats(account.access_token))
  );

  const accounts: AccountRow[] = rows.map((account, index) => {
    const stats = profileStats[index];
    const rules = ruleCounts.get(account.id) ?? { total: 0, active: 0 };
    const flows = flowCounts.get(account.id) ?? { total: 0, active: 0 };
    return {
      id: account.id,
      instagram_user_id: account.instagram_user_id,
      username: account.username,
      is_active: account.is_active,
      tokenExpired: account.token_status === "expired",
      created_at: account.created_at,
      lastActivityAt: lastActivity.get(account.id) ?? null,
      profilePictureUrl: stats?.profilePictureUrl ?? null,
      followersCount: stats?.followersCount ?? null,
      followsCount: stats?.followsCount ?? null,
      mediaCount: stats?.mediaCount ?? null,
      ruleCount: rules.total,
      activeRuleCount: rules.active,
      flowCount: flows.total,
      activeFlowCount: flows.active,
    };
  });

  const activeCount = accounts.filter(
    (account) => account.is_active && !account.tokenExpired
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <AccountsHero
        total={accounts.length}
        active={activeCount}
        paused={accounts.length - activeCount}
        repliesSent={repliesSent ?? 0}
      />

      {(connectError || error) && (
        <p
          className="rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-tint-faint)", color: "var(--danger-deep)" }}
        >
          {connectError ?? error?.message}
        </p>
      )}

      <AccountsList accounts={accounts} now={currentTimestamp()} />
    </div>
  );
}
