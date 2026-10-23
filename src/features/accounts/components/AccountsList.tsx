"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowMenu } from "@/components/ui/RowMenu";
import { SearchField, SelectField } from "@/components/ui/controls";
import { Spinner } from "@/components/ui/Spinner";
import { primaryButtonClass } from "@/components/ui/styles";
import { formatDate, formatRelative } from "@/lib/utils/format";
import {
  GridIcon,
  LayersIcon,
  ListIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { disconnectAccount, toggleAccountActive } from "@/features/accounts/actions";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function ToggleAccountButton({
  isActive,
  fullWidth = false,
}: {
  isActive: boolean;
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-black/4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10 ${
        fullWidth ? "w-full justify-center" : ""
      }`}
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
  profilePictureUrl: string | null;
  followersCount: number | null;
  followsCount: number | null;
  mediaCount: number | null;
}

function formatCount(value: number | null) {
  if (value === null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

const SORTS = {
  recent: "Recently added",
  oldest: "Oldest first",
  name: "Username A–Z",
  status: "Active first",
};

type ViewMode = "card" | "list";

const VIEW_STORAGE_KEY = "accounts-view";

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
  const [view, setView] = useState<ViewMode>("card");
  const [isRefreshing, startRefresh] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current) return;
    if (!searchParams.has("connected")) return;
    toastShown.current = true;
    toast.success("Instagram account connected.");
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synced from browser storage, unavailable during SSR
      if (stored === "card" || stored === "list") setView(stored);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  function handleRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  function handleViewChange(next: ViewMode) {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // ignore unavailable storage
    }
  }

  async function handleToggle(id: string, handle: string, nextActive: boolean) {
    try {
      await toggleAccountActive(id, nextActive);
      toast.success(`@${handle} ${nextActive ? "resumed" : "paused"}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update account."));
    }
  }

  async function handleDisconnect(id: string, handle: string) {
    try {
      await disconnectAccount(id);
      toast.success(`@${handle} disconnected.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to disconnect account."));
    }
  }

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh account stats"
            title="Refresh followers, following, and post counts"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 text-zinc-500 transition-colors hover:bg-black/4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
          >
            {isRefreshing ? (
              <Spinner className="h-4 w-4 border-current/30 border-t-current" />
            ) : (
              <RefreshIcon className="h-4 w-4" />
            )}
          </button>
          <div className="flex items-center rounded-xl border border-black/10 p-0.5 dark:border-white/15">
            <button
              type="button"
              aria-label="Card view"
              aria-pressed={view === "card"}
              onClick={() => handleViewChange("card")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                view === "card"
                  ? "bg-black/8 text-zinc-900 dark:bg-white/15 dark:text-white"
                  : "text-zinc-500 hover:bg-black/4 dark:hover:bg-white/8"
              }`}
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => handleViewChange("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                view === "list"
                  ? "bg-black/8 text-zinc-900 dark:bg-white/15 dark:text-white"
                  : "text-zinc-500 hover:bg-black/4 dark:hover:bg-white/8"
              }`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
          <a
            href="/api/instagram/connect"
            className={primaryButtonClass}
          >
            <PlusIcon className="h-4 w-4" />
            Connect Instagram account
          </a>
        </div>
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
          ) : view === "card" ? (
            <ul className="grid grid-cols-1 gap-4 border-t border-black/6 p-5 sm:grid-cols-2 xl:grid-cols-3 dark:border-white/8">
              {visible.map((account) => {
                const handle = account.username ?? account.instagram_user_id;
                return (
                  <li
                    key={account.id}
                    className="flex flex-col gap-4 rounded-2xl border border-black/6 p-4 transition-colors hover:bg-zinc-50/80 dark:border-white/8 dark:hover:bg-white/3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={handle}
                          src={account.profilePictureUrl}
                          muted={!account.is_active}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">@{handle}</p>
                          <p className="truncate text-xs text-zinc-500">
                            ID: {account.instagram_user_id}
                          </p>
                        </div>
                      </div>
                      <RowMenu
                        label={`More actions for @${handle}`}
                        items={[
                          {
                            label: "Open on Instagram",
                            href: `https://instagram.com/${handle}`,
                          },
                          {
                            label: "Copy account ID",
                            onSelect: () => {
                              navigator.clipboard?.writeText(
                                account.instagram_user_id
                              );
                              toast.info("Account ID copied to clipboard.");
                            },
                          },
                        ]}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={account.is_active ? "active" : "paused"} />
                      <p className="truncate text-xs text-zinc-400">
                        {account.lastActivityAt
                          ? `Last activity ${formatRelative(account.lastActivityAt, now)}`
                          : "No activity yet"}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 py-2.5 text-center dark:bg-white/5">
                      <div>
                        <p className="text-sm font-semibold">
                          {formatCount(account.followersCount)}
                        </p>
                        <p className="text-[11px] text-zinc-500">Followers</p>
                      </div>
                      <div className="border-x border-black/6 dark:border-white/8">
                        <p className="text-sm font-semibold">
                          {formatCount(account.followsCount)}
                        </p>
                        <p className="text-[11px] text-zinc-500">Following</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {formatCount(account.mediaCount)}
                        </p>
                        <p className="text-[11px] text-zinc-500">Posts</p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Connected on {formatDate(account.created_at)}
                    </p>

                    <div className="mt-auto flex items-center gap-2 border-t border-black/6 pt-3 dark:border-white/8">
                      <form
                        action={() =>
                          handleToggle(account.id, handle, !account.is_active)
                        }
                        className="flex-1"
                      >
                        <ToggleAccountButton isActive={account.is_active} fullWidth />
                      </form>

                      <ConfirmAction
                        action={() => handleDisconnect(account.id, handle)}
                        title="Disconnect this account?"
                        description={`@${handle} will stop listening for comments, and all its rules and DM flows will be permanently deleted. This can't be undone.`}
                        confirmLabel="Disconnect"
                        trigger={
                          <button
                            type="button"
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/15"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Disconnect
                          </button>
                        }
                        className="flex-1"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
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
                      <Avatar
                        name={handle}
                        src={account.profilePictureUrl}
                        muted={!account.is_active}
                      />
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
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {formatCount(account.followersCount)} followers ·{" "}
                          {formatCount(account.followsCount)} following ·{" "}
                          {formatCount(account.mediaCount)} posts
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusBadge status={account.is_active ? "active" : "paused"} />

                      <form
                        action={() =>
                          handleToggle(account.id, handle, !account.is_active)
                        }
                      >
                        <ToggleAccountButton isActive={account.is_active} />
                      </form>

                      <ConfirmAction
                        action={() => handleDisconnect(account.id, handle)}
                        title="Disconnect this account?"
                        description={`@${handle} will stop listening for comments, and all its rules and DM flows will be permanently deleted. This can't be undone.`}
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
                            onSelect: () => {
                              navigator.clipboard?.writeText(
                                account.instagram_user_id
                              );
                              toast.info("Account ID copied to clipboard.");
                            },
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
