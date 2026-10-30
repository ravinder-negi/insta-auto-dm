import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AutomationExecution, InstagramAccount } from "@/types";
import { currentTimestamp } from "@/lib/utils/format";
import { ArrowLeftIcon, ClockIcon } from "@/components/icons";
import { ExecutionsTable, type ExecutionRow } from "@/features/executions/components/ExecutionsTable";
import { displayFont, linkInBioCssVars, linkInBioWrapperClass } from "@/lib/linkInBioTheme";

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

  return (
    <div className={linkInBioWrapperClass} style={linkInBioCssVars}>
      <div className="flex flex-col gap-7">
        <Link
          href="/dashboard/rules"
          className="inline-flex w-fit items-center gap-2 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--secondary-soft-bg)]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to AutoDMs
        </Link>

        {/* hero */}
        <div className="relative overflow-hidden rounded-[40px] border border-[var(--line)] bg-white bg-[radial-gradient(#DDD6EC_1.2px,transparent_1.2px)] bg-[length:30px_30px]">
          <div
            className="animate-float pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full opacity-70 blur-[90px]"
            style={{ background: "var(--secondary-pale-border)" }}
          />
          <div
            className="animate-float-delayed pointer-events-none absolute -top-20 -right-24 h-[420px] w-[420px] rounded-full opacity-80 blur-[100px]"
            style={{ background: "var(--tint)" }}
          />
          <div className="relative flex flex-col gap-3.5 p-9 sm:p-11">
            <span className="animate-fade-in-up inline-flex w-fit items-center gap-2.5 rounded-full border border-[var(--line)] bg-white py-[7px] pr-4 pl-3 text-xs font-bold tracking-[0.1em] text-[var(--muted)] uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
              </span>
              Automation
            </span>
            <h1
              className={`animate-fade-in-up m-0 ${displayFont} text-[clamp(32px,4.2vw,48px)] leading-[1.03] font-extrabold tracking-[-0.035em]`}
              style={{ animationDelay: "0.1s" }}
            >
              Execution{" "}
              <span className="relative inline-block text-[var(--accent)]">
                log
                <svg
                  className="absolute bottom-[-6px] left-0 h-3.5 w-full"
                  viewBox="0 0 200 14"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9 C 40 2, 90 14, 198 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p
              className="animate-fade-in-up m-0 max-w-[540px] text-lg text-[var(--muted)]"
              style={{ animationDelay: "0.2s" }}
            >
              The most recent automated replies, newest first.
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-2xl border-[1.5px] border-[var(--danger-border)] bg-[var(--danger-tint-faint)] px-4 py-3 text-sm font-semibold text-[var(--danger-deep)]"
          >
            {error.message}
          </p>
        )}

        {executions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[36px] border-[1.5px] border-dashed border-[var(--secondary-border)] bg-[var(--secondary-faint-bg)] px-7 py-14 text-center">
            <span className="animate-float flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[var(--violet)] text-white">
              <ClockIcon className="h-[34px] w-[34px]" />
            </span>
            <h3 className={`m-0 ${displayFont} text-[28px] font-extrabold tracking-[-0.03em]`}>
              No automations have run yet
            </h3>
            <p className="m-0 max-w-[380px] text-[var(--muted)]">
              Once an AutoDM matches a comment, the reply shows up here.
            </p>
          </div>
        ) : (
          <ExecutionsTable executions={executions} accounts={accounts} now={currentTimestamp()} />
        )}
      </div>
    </div>
  );
}
