import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AutomationRule, InstagramAccount } from "@/lib/types";
import { deleteRule, toggleRuleActive } from "./actions";

type RuleRow = Pick<
  AutomationRule,
  "id" | "name" | "keyword" | "instagram_media_id" | "dm_message" | "is_active"
> & {
  instagram_accounts: Pick<InstagramAccount, "username" | "instagram_user_id"> | null;
};

export default async function RulesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_rules")
    .select(
      "id, name, keyword, instagram_media_id, dm_message, is_active, instagram_accounts(username, instagram_user_id)"
    )
    .order("created_at", { ascending: false });

  const rules = (data as unknown as RuleRow[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Automation rules</h1>
        <Link
          href="/dashboard/rules/new"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          New rule
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}

      {rules.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No rules yet. Connect an account first, then create a rule to reply
          to comments containing a keyword.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/15 dark:border-white/15">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{rule.name}</p>
                <p className="text-xs text-zinc-500">
                  keyword &ldquo;{rule.keyword}&rdquo; on @
                  {rule.instagram_accounts?.username ??
                    rule.instagram_accounts?.instagram_user_id}
                  {rule.instagram_media_id
                    ? ` · media ${rule.instagram_media_id}`
                    : " · all posts"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    rule.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {rule.is_active ? "Active" : "Paused"}
                </span>
                <form action={toggleRuleActive.bind(null, rule.id, !rule.is_active)}>
                  <button
                    type="submit"
                    className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    {rule.is_active ? "Pause" : "Resume"}
                  </button>
                </form>
                <Link
                  href={`/dashboard/rules/${rule.id}/edit`}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Edit
                </Link>
                <form action={deleteRule.bind(null, rule.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
