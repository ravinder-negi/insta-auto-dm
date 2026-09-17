"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar } from "../components/Avatar";
import { ConfirmAction } from "../components/ConfirmAction";
import { EmptyState } from "../components/EmptyState";
import { RowMenu } from "../components/RowMenu";
import { SearchField, SelectField } from "../components/controls";
import { Spinner } from "../components/Spinner";
import { primaryButtonClass } from "../components/styles";
import { formatDate, formatRelative } from "../components/format";
import { LayersIcon, PauseIcon, PlayIcon, PlusIcon, SearchIcon, TrashIcon } from "../components/icons";
import { StatusBadge } from "../components/StatusBadge";
import { disconnectAccount, toggleAccountActive } from "./actions";

function ToggleAccountButton({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-black/4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
    >
      {pending ? (
        <Spinner className="h-4 w-4 border-current/30 border-t-current" />
      ) : isActive ? (
        <PauseIcon className="h-4 w-4" />
      ) : (
        <PlayIcon className="h-4 w-4" />
      )}
      {pending ? (isActive ? "Pausing…" : "Resuming…") : isActive ? "Pause" : "Resume"}
    </button>
  );
}

export interface AccountRow {
  id: string;
  instagram_user_id: string;
  username: string | null;
  is_active: boolean;
  created_at: string;
  lastActivityAt: string | null;
}

const SORTS = {
  recent: "Recently added",
  oldest: "Oldest first",
  name: "Username A–Z",
  status: "Active first",
};

export function AccountsList({
  accounts,
  now,
}: {
  accounts: AccountRow[];
  /** Captured on the server so relative times don't shift during hydration. */
  now: number;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("recent");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? accounts.filter((account) =>
          `${account.username ?? ""} ${account.instagram_user_id}`
            .toLowerCase()
            .includes(needle)
        )
      : accounts;

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.created_at.localeCompare(b.created_at);
        case "name":
          return (a.username ?? a.instagram_user_id).localeCompare(
            b.username ?? b.instagram_user_id
          );
        case "status":
          return Number(b.is_active) - Number(a.is_active);
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
    return sorted;
  }, [accounts, query, sort]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search accounts by username..."
          className="sm:max-w-md sm:flex-1"
        />
        <a
          href="/api/instagram/connect"
          className={primaryButtonClass}
        >
          <PlusIcon className="h-4 w-4" />
          Connect Instagram account
        </a>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={<LayersIcon className="h-6 w-6" />}
          title="No accounts connected yet"
          description="Click “Connect Instagram account” to link one via Instagram Login."
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
          <header className="flex items-center justify-between gap-3 px-5 py-4">
            <h2 className="text-base font-semibold tracking-tight">
              Connected Accounts ({visible.length})
            </h2>
            <SelectField
              value={sort}
              onChange={(event) => setSort(event.target.value as keyof typeof SORTS)}
              aria-label="Sort accounts"
              className="w-44"
            >
              {Object.entries(SORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
          </header>

          {visible.length === 0 ? (
            <p className="flex items-center justify-center gap-2 border-t border-black/6 px-5 py-14 text-sm text-zinc-500 dark:border-white/8">
              <SearchIcon className="h-4 w-4" />
              No accounts match “{query}”.
            </p>
          ) : (
            <ul className="divide-y divide-black/6 border-t border-black/6 dark:divide-white/8 dark:border-white/8">
              {visible.map((account) => {
                const handle = account.username ?? account.instagram_user_id;
                return (
                  <li
                    key={account.id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-white/3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={handle} muted={!account.is_active} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">@{handle}</p>
                        <p className="truncate text-xs text-zinc-500">
                          ID: {account.instagram_user_id}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-400">
                          Connected on {formatDate(account.created_at)}
                          {account.lastActivityAt
                            ? ` · Last activity ${formatRelative(account.lastActivityAt, now)}`
                            : " · No activity yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusBadge status={account.is_active ? "active" : "paused"} />

                      <form
                        action={toggleAccountActive.bind(
                          null,
                          account.id,
                          !account.is_active
                        )}
                      >
                        <ToggleAccountButton isActive={account.is_active} />
                      </form>

                      <ConfirmAction
                        action={disconnectAccount.bind(null, account.id)}
                        title="Disconnect this account?"
                        description={`@${handle} will stop listening for comments and its rules will pause. This can't be undone.`}
                        confirmLabel="Disconnect"
                        trigger={
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/15"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Disconnect
                          </button>
                        }
                      />

                      <RowMenu
                        label={`More actions for @${handle}`}
                        items={[
                          {
                            label: "Open on Instagram",
                            href: `https://instagram.com/${handle}`,
                          },
                          {
                            label: "Copy account ID",
                            onSelect: () =>
                              navigator.clipboard?.writeText(
                                account.instagram_user_id
                              ),
                          },
                        ]}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
