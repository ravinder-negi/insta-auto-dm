import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AutomationRule, InstagramAccount } from "@/lib/types";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { primaryButtonClass } from "../components/styles";
import {
  BoltIcon,
  CheckIcon,
  CloseIcon,
  PauseIcon,
  PlusIcon,
} from "../components/icons";
import { RulesTable, type RuleTableRow } from "./RulesTable";

type RuleQueryRow = Pick<
  AutomationRule,
  | "id"
  | "name"
  | "keyword"
  | "instagram_media_id"
  | "require_follow"
  | "is_active"
  | "created_at"
  | "instagram_account_id"
> & {
  instagram_accounts: Pick<
    InstagramAccount,
    "username" | "instagram_user_id" | "is_active"
  > | null;
};

export default async function RulesPage() {
  const supabase = await createClient();

  const [{ data, error }, { data: accountsData }] = await Promise.all([
    supabase
      .from("automation_rules")
      .select(
        "id, name, keyword, instagram_media_id, require_follow, is_active, created_at, instagram_account_id, instagram_accounts(username, instagram_user_id, is_active)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id")
      .order("created_at", { ascending: false }),
  ]);

  const rules: RuleTableRow[] = ((data as unknown as RuleQueryRow[]) ?? []).map(
    (rule) => ({
      id: rule.id,
      name: rule.name,
      keyword: rule.keyword,
      instagram_media_id: rule.instagram_media_id,
      require_follow: rule.require_follow,
      is_active: rule.is_active,
      created_at: rule.created_at,
      accountId: rule.instagram_account_id,
      accountHandle:
        rule.instagram_accounts?.username ??
        rule.instagram_accounts?.instagram_user_id ??
        "unknown",
      accountActive: rule.instagram_accounts?.is_active ?? false,
    })
  );

  const accounts = (accountsData ?? []).map((account) => ({
    id: account.id as string,
    handle: (account.username ?? account.instagram_user_id) as string,
  }));

  const activeCount = rules.filter(
    (rule) => rule.is_active && rule.accountActive
  ).length;
  const pausedCount = rules.filter(
    (rule) => !rule.is_active && rule.accountActive
  ).length;
  // A rule on a paused/disconnected account can never fire, whatever its own flag.
  const disabledCount = rules.filter((rule) => !rule.accountActive).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Automation"
        title="Automation rules"
        description="Reply automatically when a comment matches a keyword."
      />

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
          {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total rules"
          value={rules.length}
          tone="indigo"
          icon={<BoltIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Active"
          value={activeCount}
          tone="green"
          icon={<CheckIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Paused"
          value={pausedCount}
          tone="amber"
          icon={<PauseIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Disabled"
          value={disabledCount}
          tone="red"
          icon={<CloseIcon className="h-5 w-5" />}
        />
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon={<BoltIcon className="h-6 w-6" />}
          title="No rules yet"
          description="Connect an account first, then create a rule to reply to comments containing a keyword."
          action={
            <Link
              href="/dashboard/rules/new"
              className={`${primaryButtonClass} mt-2`}
            >
              <PlusIcon className="h-4 w-4" />
              Create your first rule
            </Link>
          }
        />
      ) : (
        <RulesTable rules={rules} accounts={accounts} />
      )}
    </div>
  );
}
