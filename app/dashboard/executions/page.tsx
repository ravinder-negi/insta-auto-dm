import { createClient } from "@/lib/supabase/server";
import type { AutomationExecution } from "@/lib/types";
import { StatusBadge } from "../page";

export default async function ExecutionsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_executions")
    .select(
      "id, commenter_username, comment_text, dm_message, status, error_message, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const executions =
    (data as Pick<
      AutomationExecution,
      | "id"
      | "commenter_username"
      | "comment_text"
      | "dm_message"
      | "status"
      | "error_message"
      | "created_at"
    >[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Execution log</h1>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}

      {executions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No automations have run yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-zinc-500 dark:border-white/15">
              <tr>
                <th className="px-4 py-3 font-medium">Commenter</th>
                <th className="px-4 py-3 font-medium">Comment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/15">
              {executions.map((execution) => (
                <tr key={execution.id}>
                  <td className="px-4 py-3 font-medium">
                    @{execution.commenter_username ?? "unknown"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {execution.comment_text}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={execution.status} />
                    {execution.status === "failed" && execution.error_message && (
                      <p
                        className="mt-1 max-w-xs truncate text-xs text-red-600 dark:text-red-400"
                        title={execution.error_message}
                      >
                        {execution.error_message}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                    {new Date(execution.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
