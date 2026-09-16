import { createClient } from "@/lib/supabase/server";
import type { AutomationExecution, InstagramAccount } from "@/lib/types";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { currentTimestamp } from "../components/format";
import { AlertIcon, ClockIcon, SendIcon } from "../components/icons";
import { ExecutionsTable, type ExecutionRow } from "./ExecutionsTable";

type ExecutionQueryRow = Pick<
  AutomationExecution,
  | "id"
  | "commenter_username"
  | "comment_text"
  | "dm_message"
  | "status"
  | "error_message"
  | "created_at"
  | "instagram_comment_id"
  | "instagram_account_id"
> & {
  instagram_accounts: Pick<
    InstagramAccount,
    "username" | "instagram_user_id"
  > | null;
};

export default async function ExecutionsPage() {
  const supabase = await createClient();

  const [{ data, error }, { data: accountsData }] = await Promise.all([
    supabase
      .from("automation_executions")
      .select(
        "id, commenter_username, comment_text, dm_message, status, error_message, created_at, instagram_comment_id, instagram_account_id, instagram_accounts(username, instagram_user_id)"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id")
      .order("created_at", { ascending: false }),
  ]);

  const executions: ExecutionRow[] = (
    (data as unknown as ExecutionQueryRow[]) ?? []
  ).map((execution) => ({
    id: execution.id,
    commenter_username: execution.commenter_username,
    comment_text: execution.comment_text,
    dm_message: execution.dm_message,
    status: execution.status,
    error_message: execution.error_message,
    created_at: execution.created_at,
    instagram_comment_id: execution.instagram_comment_id,
    accountId: execution.instagram_account_id,
    accountHandle:
      execution.instagram_accounts?.username ??
      execution.instagram_accounts?.instagram_user_id ??
      "unknown",
  }));

  const accounts = (accountsData ?? []).map((account) => ({
    id: account.id as string,
    handle: (account.username ?? account.instagram_user_id) as string,
  }));

  const countBy = (status: string) =>
    executions.filter((execution) => execution.status === status).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Logs"
        title="Execution log"
        description="The most recent automated replies, newest first."
      />

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
          {error.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Sent"
          value={countBy("sent")}
          tone="green"
          icon={<SendIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Processing"
          value={countBy("processing")}
          tone="amber"
          icon={<ClockIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Failed"
          value={countBy("failed")}
          tone="red"
          icon={<AlertIcon className="h-5 w-5" />}
        />
      </div>

      {executions.length === 0 ? (
        <EmptyState
          icon={<ClockIcon className="h-6 w-6" />}
          title="No automations have run yet"
          description="Once a rule matches a comment, the reply shows up here."
        />
      ) : (
        <ExecutionsTable
          executions={executions}
          accounts={accounts}
          now={currentTimestamp()}
        />
      )}
    </div>
  );
}
