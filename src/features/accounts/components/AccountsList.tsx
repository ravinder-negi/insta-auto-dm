"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchField } from "@/components/ui/controls";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatRelative } from "@/lib/utils/format";
import {
  AlertIcon,
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  LayersIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
} from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { disconnectAccount, toggleAccountActive } from "@/features/accounts/actions";
import { ConnectAccountButton } from "./ConnectAccountButton";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export interface AccountRow {
  id: string;
  instagram_user_id: string;
  username: string | null;
  is_active: boolean;
  /** Meta rejected the token; nothing sends until the owner reconnects. */
  tokenExpired: boolean;
  created_at: string;
  lastActivityAt: string | null;
  profilePictureUrl: string | null;
  followersCount: number | null;
  followsCount: number | null;
  mediaCount: number | null;
  ruleCount: number;
  activeRuleCount: number;
  flowCount: number;
  activeFlowCount: number;
}

function formatCount(value: number | null) {
  if (value === null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

const connectCtaClass =
  "inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#B9AEE6] text-sm font-bold text-[var(--violet)] transition-colors hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-faint-bg)]";

type AccountStatus = "active" | "paused" | "expired";

function accountStatus(account: AccountRow): AccountStatus {
  if (account.tokenExpired) return "expired";
  return account.is_active ? "active" : "paused";
}

const STATUS_STYLES: Record<AccountStatus, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: "Active", dot: "var(--success)", text: "var(--success-text)", bg: "var(--success-tint)" },
  paused: { label: "Paused", dot: "var(--warning)", text: "var(--warning-text)", bg: "var(--warning-tint)" },
  expired: { label: "Reconnect needed", dot: "var(--danger)", text: "var(--danger-strong)", bg: "var(--danger-tint)" },
};

function StatusPill({ status }: { status: AccountStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "animate-pulse-soft" : ""}`}
        style={{ backgroundColor: style.dot }}
      />
      {style.label}
    </span>
  );
}

export function AccountsList({
  accounts,
  now,
}: {
  accounts: AccountRow[];
  /** Captured on the server so relative times don't shift during hydration. */
  now: number;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toastShown.current) return;
    if (!searchParams.has("connected")) return;
    toastShown.current = true;
    toast.success("Instagram account connected.");
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  function handleRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  async function handleToggle(id: string, handle: string, nextActive: boolean) {
    setPendingToggleId(id);
    try {
      await toggleAccountActive(id, nextActive);
      toast.success(`@${handle} ${nextActive ? "resumed" : "paused"}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update account."));
    } finally {
      setPendingToggleId(null);
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

  const sorted = useMemo(
    () => [...accounts].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [accounts]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter((account) =>
      `${account.username ?? ""} ${account.instagram_user_id}`.toLowerCase().includes(needle)
    );
  }, [sorted, query]);

  const selected = sorted.find((a) => a.id === selectedId) ?? sorted[0] ?? null;

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={<LayersIcon className="h-6 w-6" />}
        title="No accounts connected yet"
        description="Connect an Instagram account to start automating comment replies."
        action={
          <ConnectAccountButton
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#B9AEE6] px-6 text-sm font-bold text-[var(--violet)] transition-colors hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-faint-bg)]"
          >
            <PlusIcon className="h-4 w-4" />
            Connect Instagram account
          </ConnectAccountButton>
        }
      />
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {/* LEFT: account list */}
      <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-4" style={{ maxWidth: 420 }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight">Accounts</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh account stats"
              title="Refresh followers, following, and post counts"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-zinc-500 transition-colors hover:bg-black/4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
            >
              {isRefreshing ? (
                <Spinner className="h-3.5 w-3.5 border-current/30 border-t-current" />
              ) : (
                <RefreshIcon className="h-3.5 w-3.5" />
              )}
            </button>
            <span className="rounded-full bg-[var(--tint2)] px-3.5 py-1 text-sm font-bold text-[var(--violet)]">
              {visible.length}
            </span>
          </div>
        </div>

        <SearchField value={query} onChange={setQuery} placeholder="Search by username" />

        <div className="flex flex-col gap-3">
          {visible.map((account) => {
            const handle = account.username ?? account.instagram_user_id;
            const isSelected = selected?.id === account.id;
            const status = STATUS_STYLES[accountStatus(account)];
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedId(account.id)}
                aria-pressed={isSelected}
                className={`flex items-center gap-3.5 rounded-3xl border p-4 text-left transition-all duration-200 hover:translate-x-1.5 ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--tint-faint)] shadow-[0_20px_40px_-24px_color-mix(in srgb, var(--primary) 45%, transparent)]"
                    : "border-[var(--line)] bg-white"
                }`}
              >
                <Avatar name={handle} src={account.profilePictureUrl} muted={!account.is_active} size="lg" ring />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold">@{handle}</span>
                  <span
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: status.text }}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${accountStatus(account) === "active" ? "animate-pulse-soft" : ""}`}
                      style={{ backgroundColor: status.dot }}
                    />
                    {status.label}
                  </span>
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 -rotate-90 ${isSelected ? "text-[var(--primary)]" : "text-[var(--muted-soft)]"}`}
                />
              </button>
            );
          })}
        </div>

        {visible.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[var(--secondary-border)] bg-[var(--secondary-faint-bg)] px-5 py-7 text-center text-sm text-[var(--muted)]">
            No account matches &ldquo;{query.trim()}&rdquo;.
          </div>
        )}

        <ConnectAccountButton className={connectCtaClass}>
          <PlusIcon className="h-4.5 w-4.5" />
          Add another account
        </ConnectAccountButton>
      </div>

      {/* RIGHT: detail panel */}
      <div className="min-w-0 flex-[2_1_460px]">
        {selected && (() => {
          const handle = selected.username ?? selected.instagram_user_id;
          const pending = pendingToggleId === selected.id;
          return (
            <div className="overflow-hidden rounded-[36px] border border-[var(--line)] bg-white shadow-[0_40px_80px_-48px_color-mix(in srgb, var(--ink) 45%, transparent)]">
              {/* banner */}
              <div
                className="relative flex flex-wrap items-center gap-5 p-8"
                style={{ backgroundImage: "linear-gradient(120deg,var(--tint) 0%,var(--tint2) 100%)" }}
              >
                <Avatar name={handle} src={selected.profilePictureUrl} muted={!selected.is_active} ring size="xl" />
                <div className="relative min-w-0 flex-1 basis-[220px]">
                  <h3 className="truncate text-3xl font-extrabold tracking-tight" style={{ color: "var(--ink)" }}>
                    @{handle}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <StatusPill status={accountStatus(selected)} />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard?.writeText(selected.instagram_user_id);
                        } catch {
                          // Clipboard unavailable — nothing more we can do here.
                        }
                        setCopied(true);
                        if (copyTimer.current) clearTimeout(copyTimer.current);
                        copyTimer.current = setTimeout(() => setCopied(false), 1600);
                      }}
                      aria-label="Copy account ID"
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{ borderColor: "color-mix(in srgb, var(--ink) 14%, transparent)", backgroundColor: "rgba(255,255,255,.7)", color: "var(--ink)" }}
                    >
                      <CopyIcon className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {copied ? "Copied" : `ID: ${selected.instagram_user_id}`}
                      </span>
                    </button>
                    <a
                      href={`https://instagram.com/${handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{ borderColor: "color-mix(in srgb, var(--ink) 14%, transparent)", backgroundColor: "rgba(255,255,255,.7)", color: "var(--ink)" }}
                    >
                      <ExternalLinkIcon className="h-3 w-3" />
                      Open on Instagram
                    </a>
                  </div>
                </div>
                <div
                  className="relative flex items-center gap-3 rounded-2xl py-2.5 pr-3.5 pl-4"
                  style={{ backgroundColor: "rgba(255,255,255,.8)" }}
                >
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                      Auto replies
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {selected.is_active ? "Replying to matching comments" : "Paused, no replies are sent"}
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={selected.is_active}
                    aria-label="Auto replies for this account"
                    disabled={pending}
                    onClick={() => handleToggle(selected.id, handle, !selected.is_active)}
                    className="flex h-9 w-[60px] shrink-0 items-center rounded-full p-1 transition-colors disabled:opacity-60"
                    style={{ backgroundColor: selected.is_active ? "var(--success)" : "var(--secondary-pale)" }}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow transition-transform"
                      style={{ transform: selected.is_active ? "translateX(24px)" : "translateX(0)" }}
                    >
                      {pending && <Spinner className="h-3.5 w-3.5 border-zinc-300 border-t-zinc-600" />}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-6 p-7 sm:p-8">
                {selected.tokenExpired && (
                  <div
                    role="alert"
                    className="flex flex-wrap items-center gap-4 rounded-[22px] border p-5"
                    style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-tint-faint)" }}
                  >
                    <span className="shrink-0" style={{ color: "var(--danger-strong)" }}>
                      <AlertIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1 basis-[220px]">
                      <p className="text-sm font-bold" style={{ color: "var(--danger-deep)" }}>
                        Instagram disconnected @{handle}
                      </p>
                      <p className="mt-1 text-sm" style={{ color: "var(--danger-deep)" }}>
                        AutoDMs and DM Flows on this account are on hold. Reconnect to resume them; your
                        rules, flows and leads are kept.
                      </p>
                    </div>
                    <ConnectAccountButton
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white"
                      style={{ backgroundColor: "var(--danger-strong)" }}
                    >
                      <RefreshIcon className="h-4 w-4" />
                      Reconnect @{handle}
                    </ConnectAccountButton>
                  </div>
                )}

                {/* stats */}
                <div className="flex flex-wrap gap-3.5">
                  <div className="min-w-0 flex-1 basis-[140px] rounded-[22px] p-5" style={{ backgroundColor: "var(--tint)" }}>
                    <div className="text-4xl leading-none font-extrabold tracking-tight">
                      {formatCount(selected.followersCount)}
                    </div>
                    <div className="mt-1.5 text-sm font-semibold" style={{ color: "#4A3540" }}>
                      Followers
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 basis-[140px] rounded-[22px] p-5" style={{ backgroundColor: "var(--tint2)" }}>
                    <div className="text-4xl leading-none font-extrabold tracking-tight">
                      {formatCount(selected.followsCount)}
                    </div>
                    <div className="mt-1.5 text-sm font-semibold" style={{ color: "#3B3560" }}>
                      Following
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 basis-[140px] rounded-[22px] p-5" style={{ backgroundColor: "var(--success-tint)" }}>
                    <div className="text-4xl leading-none font-extrabold tracking-tight">
                      {formatCount(selected.mediaCount)}
                    </div>
                    <div className="mt-1.5 text-sm font-semibold" style={{ color: "#24503F" }}>
                      Posts
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-5">
                  {/* automations */}
                  <div className="min-w-0 flex-1 basis-[280px] rounded-[26px] border p-6" style={{ borderColor: "var(--line)", backgroundColor: "var(--bg)" }}>
                    <h4 className="text-lg font-bold tracking-tight">Automations on this account</h4>
                    {selected.ruleCount === 0 && selected.flowCount === 0 ? (
                      <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                        No AutoDMs or DM Flows yet on @{handle}.
                      </p>
                    ) : (
                      <div className="mt-4 flex flex-col gap-3">
                        <Link
                          href="/dashboard/rules"
                          className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors hover:bg-black/3"
                          style={{ borderColor: "var(--line)" }}
                        >
                          <span className="font-medium">AutoDMs</span>
                          <span className="font-bold" style={{ color: "var(--primary)" }}>
                            {selected.activeRuleCount}/{selected.ruleCount} active
                          </span>
                        </Link>
                        <Link
                          href="/dashboard/flows"
                          className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors hover:bg-black/3"
                          style={{ borderColor: "var(--line)" }}
                        >
                          <span className="font-medium">DM Flows</span>
                          <span className="font-bold" style={{ color: "var(--violet)" }}>
                            {selected.activeFlowCount}/{selected.flowCount} active
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* activity */}
                  <div className="min-w-0 flex-1 basis-[280px] rounded-[26px] border p-6" style={{ borderColor: "var(--line)", backgroundColor: "var(--bg)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-lg font-bold tracking-tight">Recent activity</h4>
                    </div>
                    <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                      {selected.lastActivityAt
                        ? `Last activity ${formatRelative(selected.lastActivityAt, now)}`
                        : "Your first auto-DM will show up here as soon as a rule runs."}
                    </p>
                  </div>
                </div>

                {/* footer */}
                <div className="flex flex-wrap items-center justify-between gap-3.5 border-t pt-5" style={{ borderColor: "var(--line)" }}>
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    Connected on {formatDate(selected.created_at)}
                  </span>
                  <ConfirmAction
                    action={() => handleDisconnect(selected.id, handle)}
                    title="Disconnect this account?"
                    description={`@${handle} will stop listening for comments, and all its rules and DM flows will be permanently deleted. This can't be undone.`}
                    confirmLabel="Disconnect"
                    trigger={
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-colors"
                        style={{ borderColor: "var(--danger-border)", color: "var(--danger-strong)" }}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Disconnect account
                      </button>
                    }
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
