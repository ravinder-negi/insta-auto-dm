import { createClient } from "@/lib/supabase/server";
import type { InstagramAccount } from "@/lib/types";
import { PageHeader } from "../components/PageHeader";
import { currentTimestamp } from "../components/format";
import { StatCard } from "../components/StatCard";
import {
  ChatIcon,
  CheckIcon,
  DotsIcon,
  LayersIcon,
  PauseIcon,
  SendIcon,
  TrendingIcon,
  UsersIcon,
} from "../components/icons";
import { AccountsHero } from "./AccountsHero";
import { AccountsList, type AccountRow } from "./AccountsList";

const HIGHLIGHTS = [
  {
    icon: ChatIcon,
    tone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    title: "Auto reply",
    description: "Respond instantly",
  },
  {
    icon: UsersIcon,
    tone: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    title: "Save time",
    description: "Focus on what matters",
  },
  {
    icon: TrendingIcon,
    tone: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    title: "Grow faster",
    description: "Turn comments into customers",
  },
];

export default async function AccountsPage(
  props: PageProps<"/dashboard/accounts">
) {
  const searchParams = await props.searchParams;
  const errorParam = searchParams.error;
  const connectError = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  const supabase = await createClient();

  const [{ data, error }, { data: activity }, { count: repliesSent }] =
    await Promise.all([
      supabase
        .from("instagram_accounts")
        .select("id, instagram_user_id, username, is_active, created_at")
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
    ]);

  const lastActivity = new Map<string, string>();
  for (const row of activity ?? []) {
    if (row.instagram_account_id && !lastActivity.has(row.instagram_account_id)) {
      lastActivity.set(row.instagram_account_id, row.created_at);
    }
  }

  const rows = (data ?? []) as Pick<
    InstagramAccount,
    "id" | "instagram_user_id" | "username" | "is_active" | "created_at"
  >[];

  const accounts: AccountRow[] = rows.map((account) => ({
    ...account,
    lastActivityAt: lastActivity.get(account.id) ?? null,
  }));

  const activeCount = accounts.filter((account) => account.is_active).length;
  const activeShare =
    accounts.length > 0 ? Math.round((activeCount / accounts.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col max-[1070px]:gap-6">
        <PageHeader
          eyebrow="Instagram accounts"
          title={
            <>
              Manage your <span className="brand-text-gradient">Instagram accounts</span>
            </>
          }
          description="Connect the accounts you want to automate comment replies for."
          aside={<AccountsHero />}
        />

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {HIGHLIGHTS.map((highlight, index) => (
            <div key={highlight.title} className="flex items-center gap-3">
              {index > 0 && (
                <span className="mr-5 hidden h-10 w-px bg-black/8 sm:block dark:bg-white/10" />
              )}
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${highlight.tone}`}
              >
                <highlight.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{highlight.title}</p>
                <p className="text-xs text-zinc-500">{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(connectError || error) && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
          {connectError ?? error?.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Connected accounts"
          value={accounts.length}
          tone="indigo"
          icon={<LayersIcon className="h-5 w-5" />}
          corner={<UsersIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Active accounts"
          value={activeCount}
          tone="green"
          icon={<CheckIcon className="h-5 w-5" />}
          trend={{ label: `↑ ${activeShare}%`, caption: "of connected" }}
        />
        <StatCard
          label="Paused accounts"
          value={accounts.length - activeCount}
          tone="amber"
          icon={<PauseIcon className="h-5 w-5" />}
          corner={<DotsIcon className="h-4 w-4 rotate-90" />}
        />
        <StatCard
          label="Total replies sent"
          value={repliesSent ?? 0}
          tone="blue"
          icon={<UsersIcon className="h-5 w-5" />}
          corner={<SendIcon className="h-4 w-4" />}
        />
      </div>

      <AccountsList accounts={accounts} now={currentTimestamp()} />
    </div>
  );
}
