import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AutomationExecution } from "@/lib/types";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();

  const [accountsResult, rulesResult, executionsResult] = await Promise.all([
    supabase
      .from("instagram_accounts")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("automation_rules")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("automation_executions")
      .select(
        "id, comment_text, commenter_username, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const accountCount = accountsResult.count ?? 0;
  const activeRuleCount = rulesResult.count ?? 0;
  const recentExecutions =
    (executionsResult.data as Pick<
      AutomationExecution,
      "id" | "comment_text" | "commenter_username" | "status" | "created_at"
    >[]) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Connected accounts"
          value={accountCount}
          href="/dashboard/accounts"
        />
        <StatCard
          label="Active rules"
          value={activeRuleCount}
          href="/dashboard/rules"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <Link
            href="/dashboard/executions"
            className="text-sm text-zinc-500 hover:underline"
          >
            View all
          </Link>
        </div>

        {recentExecutions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No automations have run yet. Connect an account and add a rule to
            get started.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/15 dark:border-white/15">
            {recentExecutions.map((execution) => (
              <li
                key={execution.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="truncate">
                  <span className="font-medium">
                    @{execution.commenter_username ?? "unknown"}
                  </span>{" "}
                  <span className="text-zinc-500">
                    commented &ldquo;{execution.comment_text}&rdquo;
                  </span>
                </span>
                <StatusBadge status={execution.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-black/10 p-5 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
    >
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    processing:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {status}
    </span>
  );
}
