"use client";

import { useMemo, useState } from "react";
import { Avatar } from "../components/Avatar";
import { SearchField, SelectField } from "../components/controls";
import { formatDateTime } from "../components/format";
import {
  CalendarIcon,
  CloseIcon,
  InstagramIcon,
  ReceiptIcon,
  SearchIcon,
  UserIcon,
} from "../components/icons";
import { StatusBadge } from "../components/StatusBadge";

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

const RANGES: Record<string, { label: string; days: number | null }> = {
  "7": { label: "Last 7 days", days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
  all: { label: "All time", days: null },
};

const HEAD_CLASS =
  "px-5 py-3 text-left text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase";

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
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<ExecutionRow | null>(null);

  const visible = useMemo(() => {
    const days = RANGES[range].days;
    const cutoff = days === null ? null : now - days * 86_400_000;
    const needle = query.trim().toLowerCase();

    return executions.filter((execution) => {
      if (cutoff !== null && new Date(execution.created_at).getTime() < cutoff)
        return false;
      if (accountId !== "all" && execution.accountId !== accountId) return false;
      if (!needle) return true;
      return `${execution.commenter_username ?? ""} ${execution.comment_text ?? ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [executions, range, accountId, query, now]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <SelectField
          value={range}
          onChange={(event) => setRange(event.target.value)}
          aria-label="Filter by date range"
          icon={<CalendarIcon className="h-4 w-4" />}
          className="sm:w-48"
        >
          {Object.entries(RANGES).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          aria-label="Filter by account"
          icon={<InstagramIcon className="h-4 w-4" />}
          className="sm:w-52"
        >
          <option value="all">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              @{account.handle}
            </option>
          ))}
        </SelectField>

        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by comment or user..."
          className="sm:w-72"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="border-b border-black/6 bg-zinc-50/70 dark:border-white/8 dark:bg-white/3">
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
            <tbody className="divide-y divide-black/6 dark:divide-white/8">
              {visible.map((execution) => (
                <tr
                  key={execution.id}
                  className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/3"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <UserIcon className="h-4 w-4" />
                      </span>
                      <span className="font-medium">
                        @{execution.commenter_username ?? "unknown"}
                      </span>
                    </div>
                  </td>

                  <td className="max-w-xs truncate px-5 py-4 text-zinc-600 dark:text-zinc-300">
                    {execution.comment_text ?? "—"}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={execution.accountHandle} size="sm" />
                      <span className="text-zinc-600 dark:text-zinc-300">
                        @{execution.accountHandle}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={execution.status} />
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-zinc-500">
                    {formatDateTime(execution.created_at)}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setDetail(execution)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/4 dark:border-white/15 dark:hover:bg-white/10"
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

        {visible.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-zinc-500">
            <SearchIcon className="h-4 w-4" />
            No executions match the current filters.
          </p>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close details"
            onClick={() => setDetail(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="animate-fade-in-up relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/6 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-900">
            <button
              type="button"
              aria-label="Close details"
              onClick={() => setDetail(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <CloseIcon className="h-4 w-4" />
            </button>

            <h2 className="text-base font-semibold tracking-tight">
              Execution details
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {formatDateTime(detail.created_at)}
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <DetailRow label="Status">
                <StatusBadge status={detail.status} />
              </DetailRow>
              <DetailRow label="Commenter">
                @{detail.commenter_username ?? "unknown"}
              </DetailRow>
              <DetailRow label="Account">@{detail.accountHandle}</DetailRow>
              <DetailRow label="Comment">{detail.comment_text ?? "—"}</DetailRow>
              <DetailRow label="DM sent">{detail.dm_message ?? "—"}</DetailRow>
              {detail.instagram_comment_id && (
                <DetailRow label="Comment ID">
                  <span className="font-mono text-xs">
                    {detail.instagram_comment_id}
                  </span>
                </DetailRow>
              )}
              {detail.error_message && (
                <DetailRow label="Error">
                  <span className="text-rose-600 dark:text-rose-400">
                    {detail.error_message}
                  </span>
                </DetailRow>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm break-words whitespace-pre-wrap">{children}</div>
    </div>
  );
}
