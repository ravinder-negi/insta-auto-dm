import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AutomationRule, InstagramAccount } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { AutomationHero } from "@/components/ui/AutomationHero";
import { primaryButtonClass } from "@/components/ui/styles";
import { BoltIcon, ChartIcon, ClockIcon, PlusIcon } from "@/components/icons";
import { NewRuleButton } from "@/features/rules/components/NewRuleButton";
import { RulesTable, type RuleTableRow } from "@/features/rules/components/RulesTable";
import { getViewPreference } from "@/lib/viewPreference/server";
import { VIEW_PREFERENCE_KEYS } from "@/lib/viewPreference/keys";

type RuleQueryRow = Pick<
  AutomationRule,
  | "id"
  | "name"
  | "trigger_type"
  | "keyword_match"
  | "keywords"
  | "keyword"
  | "instagram_media_id"
  | "instagram_media_shortcode"
  | "require_follow"
  | "dm_message"
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
  const initialView = await getViewPreference(VIEW_PREFERENCE_KEYS.rules, ["card", "list"] as const, "card");
  const supabase = await createClient();

  const [{ data, error }, { data: accountsData }] = await Promise.all([
    supabase
      .from("automation_rules")
      .select(
        "id, name, trigger_type, keyword_match, keywords, keyword, instagram_media_id, instagram_media_shortcode, require_follow, dm_message, is_active, created_at, instagram_account_id, instagram_accounts(username, instagram_user_id, is_active)"
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
      triggerType: rule.trigger_type,
      keywordMatch: rule.keyword_match,
      // Rules created before keyword sets existed only have the singular column.
      keywords: rule.keywords?.length
        ? rule.keywords
        : rule.keyword
          ? [rule.keyword]
          : [],
      instagram_media_id: rule.instagram_media_id,
      instagram_media_shortcode: rule.instagram_media_shortcode,
      require_follow: rule.require_follow,
      dm_message: rule.dm_message,
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

  return (
    <div className="flex flex-col gap-8">
      <AutomationHero
        titlePlain="Auto"
        titleAccent="DMs"
        description="Each AutoDM watches for a keyword in comments, story replies, shares or DMs and sends the DM you wrote."
        actions={
          <>
            <Link
              href="/dashboard/rules/analytics"
              className="inline-flex min-h-[50px] items-center gap-2.5 rounded-full border px-5.5 font-semibold"
              style={{ borderColor: "var(--line)", backgroundColor: "#fff", color: "var(--ink)" }}
            >
              <ChartIcon className="h-4.5 w-4.5" />
              Analytics
            </Link>
            <Link
              href="/dashboard/rules/executions"
              className="inline-flex min-h-[50px] items-center gap-2.5 rounded-full border px-5.5 font-semibold"
              style={{ borderColor: "var(--line)", backgroundColor: "#fff", color: "var(--ink)" }}
            >
              <ClockIcon className="h-4.5 w-4.5" />
              Execution log
            </Link>
          </>
        }
      />

      {error && (
        <p
          className="rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-tint-faint)", color: "var(--danger-deep)" }}
        >
          {error.message}
        </p>
      )}

      {rules.length === 0 ? (
        <EmptyState
          icon={<BoltIcon className="h-6 w-6" />}
          title="No AutoDMs yet"
          description="Connect an account first, then create an AutoDM to reply to comments containing a keyword."
          action={
            <NewRuleButton className={`${primaryButtonClass} mt-2`}>
              <PlusIcon className="h-4 w-4" />
              Create your first AutoDM
            </NewRuleButton>
          }
        />
      ) : (
        <RulesTable rules={rules} accounts={accounts} initialView={initialView} />
      )}
    </div>
  );
}
