import { createClient } from "@/lib/supabase/server";
import type { InstagramAccount } from "@/lib/types";
import { disconnectAccount, toggleAccountActive } from "./actions";

export default async function AccountsPage(
  props: PageProps<"/dashboard/accounts">
) {
  const searchParams = await props.searchParams;
  const errorParam = searchParams.error;
  const connectError = Array.isArray(errorParam) ? errorParam[0] : errorParam;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instagram_accounts")
    .select(
      "id, instagram_user_id, username, is_active, created_at"
    )
    .order("created_at", { ascending: false });

  const accounts =
    (data as Pick<
      InstagramAccount,
      "id" | "instagram_user_id" | "username" | "is_active" | "created_at"
    >[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Instagram accounts</h1>
        <a
          href="/api/instagram/connect"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Connect Instagram account
        </a>
      </div>

      {(connectError || error) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {connectError ?? error?.message}
        </p>
      )}

      {accounts.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No accounts connected yet. Click &ldquo;Connect Instagram
          account&rdquo; to link one via Instagram Login.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/15 dark:border-white/15">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  @{account.username ?? account.instagram_user_id}
                </p>
                <p className="text-xs text-zinc-500">
                  ID: {account.instagram_user_id}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    account.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {account.is_active ? "Active" : "Paused"}
                </span>
                <form
                  action={toggleAccountActive.bind(
                    null,
                    account.id,
                    !account.is_active
                  )}
                >
                  <button
                    type="submit"
                    className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    {account.is_active ? "Pause" : "Resume"}
                  </button>
                </form>
                <form action={disconnectAccount.bind(null, account.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Disconnect
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
