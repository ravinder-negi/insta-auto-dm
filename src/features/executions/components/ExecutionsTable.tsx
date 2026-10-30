"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/Avatar";
import { StatusChip } from "@/components/ui/LinkInBioCollection";
import { PillSelect } from "@/components/ui/PillSelect";
import { formatDateTime } from "@/lib/utils/format";
import { explainSendError } from "@/lib/instagram/sendErrors";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CloseIcon,
  InstagramIcon,
  ReceiptIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";

export interface ExecutionRow {
  id: string;
  commenter_username: string | null;
  comment_text: string | null;
  dm_message: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  instagram_comment_id: string | null;
  accountId: string | null;
  accountHandle: string;
}

export interface AccountFilterOption {
  id: string;
  handle: string;
}

type StatusFilter = "all" | "sent" | "processing" | "failed";

const RANGES: Record<string, { label: string; days: number | null }> = {
  "7": { label: "Last 7 days", days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
  all: { label: "All time", days: null },
};

const STATUS_META: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  sent: { label: "Sent", bg: "var(--success-tint)", fg: "var(--success-text)", dot: "var(--success)" },
  processing: { label: "Processing", bg: "var(--warning-tint)", fg: "var(--warning-text)", dot: "var(--warning)" },
  failed: { label: "Failed", bg: "var(--danger-tint)", fg: "var(--danger-deep)", dot: "var(--danger)" },
};

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, bg: "var(--neutral-tint)", fg: "var(--neutral-text)", dot: "var(--neutral-dot)" };
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

const PAGE_SIZE = 20;

export function ExecutionsTable({
  executions,
  accounts,
  now,
}: {
  executions: ExecutionRow[];
  accounts: AccountFilterOption[];
  /** Captured on the server so the range filter is stable across hydration. */
  now: number;
}) {
  const [range, setRange] = useState("7");
  const [accountId, setAccountId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<ExecutionRow | null>(null);
  const [page, setPage] = useState(0);

  const withinRange = useMemo(() => {
    const days = RANGES[range].days;
    const cutoff = days === null ? null : now - days * 86_400_000;
    return executions.filter(
      (execution) => cutoff === null || new Date(execution.created_at).getTime() >= cutoff
    );
  }, [executions, range, now]);

  const counts = useMemo(
    () => ({
      all: withinRange.length,
      sent: withinRange.filter((execution) => execution.status === "sent").length,
      processing: withinRange.filter((execution) => execution.status === "processing").length,
      failed: withinRange.filter((execution) => execution.status === "failed").length,
    }),
    [withinRange]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return withinRange.filter((execution) => {
      if (status !== "all" && execution.status !== status) return false;
      if (accountId !== "all" && execution.accountId !== accountId) return false;
      if (!needle) return true;
      return `${execution.commenter_username ?? ""} ${execution.comment_text ?? ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [withinRange, status, accountId, query]);

  useEffect(() => {
    // Reset to the first page whenever a filter narrows the result set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0);
  }, [range, accountId, status, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2.5">
          <StatusChip label="All" dot="var(--neutral-dot)" count={counts.all} active={status === "all"} onClick={() => setStatus("all")} />
          <StatusChip label="Sent" dot="var(--success)" count={counts.sent} active={status === "sent"} onClick={() => setStatus("sent")} />
          <StatusChip
            label="Processing"
            dot="var(--warning)"
            count={counts.processing}
            active={status === "processing"}
            onClick={() => setStatus("processing")}
          />
          <StatusChip label="Failed" dot="var(--primary)" count={counts.failed} active={status === "failed"} onClick={() => setStatus("failed")} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PillSelect value={range} onChange={setRange} icon={<CalendarIcon className="h-4 w-4" />} ariaLabel="Filter by date range">
            {Object.entries(RANGES).map(([value, option]) => (
              <option key={value} value={value}>
                {option.label}
              </option>
            ))}
          </PillSelect>

          <PillSelect value={accountId} onChange={setAccountId} icon={<InstagramIcon className="h-4 w-4" />} ariaLabel="Filter by account">
            <option value="all">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                @{account.handle}
              </option>
            ))}
          </PillSelect>

          <div className="focus-within:border-[var(--primary)] flex min-w-[220px] items-center gap-2.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 transition-colors">
            <SearchIcon className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" />
            <input
              type="search"
              aria-label="Search by comment or user"
              placeholder="Search by comment or user…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-[46px] w-full border-0 bg-transparent text-sm outline-none placeholder:text-[var(--muted-soft)]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {visible.map((execution) => (
          <button
            key={execution.id}
            type="button"
            onClick={() => setDetail(execution)}
            className="flex cursor-pointer flex-col gap-3 rounded-[24px] border-[1.5px] border-[var(--line)] bg-white p-4 text-left transition-colors hover:border-[var(--secondary-border)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-tint)] text-[var(--muted)]">
                  <UserIcon className="h-4 w-4" />
                </span>
                <span className="truncate font-semibold">@{execution.commenter_username ?? "unknown"}</span>
              </div>
              <StatusPill status={execution.status} />
            </div>

            <p className="truncate text-sm text-[var(--muted)]">{execution.comment_text ?? "—"}</p>

            <div className="flex items-center justify-between text-xs text-[var(--muted-soft)]">
              <div className="flex items-center gap-2">
                <Avatar name={execution.accountHandle} size="sm" />
                <span>@{execution.accountHandle}</span>
              </div>
              <span>{formatDateTime(execution.created_at)}</span>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="flex items-center justify-center gap-2 rounded-[24px] border-[1.5px] border-[var(--line)] px-5 py-14 text-sm text-[var(--muted)]">
            <SearchIcon className="h-4 w-4" />
            No executions match the current filters.
          </p>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-[30px] border-[1.5px] border-[var(--line)] bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="border-b-[1.5px] border-[var(--line)] bg-[var(--bg)]">
              <tr>
                <th className={HEAD_CLASS}>User</th>
                <th className={HEAD_CLASS}>Comment</th>
                <th className={HEAD_CLASS}>Account</th>
                <th className={HEAD_CLASS}>Status</th>
                <th className={HEAD_CLASS}>Sent at</th>
                <th className={HEAD_CLASS}>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-[1.5px] divide-[var(--line)]">
              {visible.map((execution) => (
                <tr key={execution.id} className="transition-colors hover:bg-[var(--bg)]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-tint)] text-[var(--muted)]">
                        <UserIcon className="h-4 w-4" />
                      </span>
                      <span className="font-semibold">@{execution.commenter_username ?? "unknown"}</span>
                    </div>
                  </td>

                  <td className="max-w-xs truncate px-5 py-4 text-[var(--muted)]">{execution.comment_text ?? "—"}</td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={execution.accountHandle} size="sm" />
                      <span className="text-[var(--muted)]">@{execution.accountHandle}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <StatusPill status={execution.status} />
                  </td>

                  <td className="px-5 py-4 text-[var(--muted-soft)] whitespace-nowrap">{formatDateTime(execution.created_at)}</td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setDetail(execution)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-[var(--line)] px-3.5 py-1.5 text-xs font-bold transition-colors hover:bg-[var(--secondary-soft-bg)]"
                    >
                      <ReceiptIcon className="h-3.5 w-3.5" />
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-[var(--muted)]">
            <SearchIcon className="h-4 w-4" />
            No executions match the current filters.
          </p>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-[var(--muted)]">
          <p className="m-0">
            Showing {currentPage * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE + PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-3.5 py-1.5 text-xs font-bold transition-colors hover:bg-[var(--secondary-soft-bg)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="text-xs font-semibold text-[var(--muted-soft)]">
              Page {currentPage + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage >= pageCount - 1}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-3.5 py-1.5 text-xs font-bold transition-colors hover:bg-[var(--secondary-soft-bg)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {detail &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--ink)]/55 p-5">
            <button
              type="button"
              aria-label="Close details"
              onClick={() => setDetail(null)}
              className="absolute inset-0 cursor-default border-0 bg-transparent"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Execution details"
              className="relative my-auto flex w-full max-w-lg flex-col gap-4.5 rounded-[32px] bg-white p-8 shadow-[0_50px_100px_-30px_rgba(0,0,0,.6)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-[24px] font-extrabold tracking-[-0.02em]">Execution details</h3>
                  <p className="m-0 mt-1 text-sm text-[var(--muted)]">{formatDateTime(detail.created_at)}</p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setDetail(null)}
                  className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[var(--line)] bg-white text-[var(--ink)] transition-colors hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-soft-bg)]"
                >
                  <CloseIcon className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <DetailRow label="Status">
                  <StatusPill status={detail.status} />
                </DetailRow>
                <DetailRow label="Commenter">@{detail.commenter_username ?? "unknown"}</DetailRow>
                <DetailRow label="Account">@{detail.accountHandle}</DetailRow>
                <DetailRow label="Comment">{detail.comment_text ?? "—"}</DetailRow>
                <DetailRow label="DM sent">{detail.dm_message ?? "—"}</DetailRow>
                {detail.instagram_comment_id && (
                  <DetailRow label="Comment ID">
                    <span className="font-mono text-xs">{detail.instagram_comment_id}</span>
                  </DetailRow>
                )}
                {detail.error_message && (
                  <DetailRow label="Why it failed">
                    <SendErrorDetail raw={detail.error_message} />
                  </DetailRow>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function SendErrorDetail({ raw }: { raw: string }) {
  const explanation = explainSendError(raw);
  if (!explanation) return null;

  return (
    <div className="flex flex-col gap-1.5 whitespace-normal">
      <span className="font-semibold text-[var(--danger-strong)]">{explanation.title}</span>
      {explanation.hint && <span className="text-[var(--muted)]">{explanation.hint}</span>}
      <details className="text-xs text-[var(--muted)]">
        <summary className="cursor-pointer select-none">Technical details</summary>
        <span className="mt-1 block font-mono break-all whitespace-pre-wrap">{explanation.raw}</span>
      </details>
    </div>
  );
}

const HEAD_CLASS = "px-5 py-3 text-left text-[11px] font-bold tracking-[0.08em] text-[var(--muted-soft)] uppercase";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="m-0 text-[11px] font-bold tracking-[0.08em] text-[var(--muted-soft)] uppercase">{label}</p>
      <div className="mt-1 text-sm break-words whitespace-pre-wrap">{children}</div>
    </div>
  );
}
