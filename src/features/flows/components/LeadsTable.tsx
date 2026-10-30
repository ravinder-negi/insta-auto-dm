"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DownloadIcon,
  MailIcon,
  SearchIcon,
} from "@/components/icons";
import { formatDate, formatTime } from "@/lib/utils/format";
import { toCsv } from "./leadsCsv";

export interface LeadRow {
  id: string;
  /** Absent for leads captured outside Instagram, e.g. lead-magnet web forms. */
  ig_sender_id?: string | null;
  email: string;
  collected_at: string;
}

const HEAD_CLASS =
  "px-5 py-3 text-left text-[11px] font-bold tracking-[0.08em] text-[var(--muted-soft)] uppercase";

const PAGE_SIZE = 20;

function downloadCsv(leads: LeadRow[], flowName: string) {
  // The BOM makes Excel read the file as UTF-8 instead of garbling
  // non-ASCII characters.
  const blob = new Blob(["\uFEFF", toCsv(leads)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = flowName
    .trim()
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replaceAll(/^-+|-+$/g, "");
  link.href = url;
  link.download = `${slug || "export"}-leads.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function MailChip() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-tint)] text-[var(--muted)]">
      <MailIcon className="h-4 w-4" />
    </span>
  );
}

export function LeadsTable({
  leads,
  flowName,
}: {
  leads: LeadRow[];
  flowName: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter((lead) => lead.email.toLowerCase().includes(needle));
  }, [leads, query]);

  useEffect(() => {
    // Reset to the first page whenever the search narrows the result set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0);
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <p className="m-0 text-sm text-[var(--muted)]">
          {leads.length} email{leads.length === 1 ? "" : "s"} collected
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="focus-within:border-[var(--primary)] flex min-w-[220px] items-center gap-2.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 transition-colors">
            <SearchIcon className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" />
            <input
              type="search"
              aria-label="Search by email"
              placeholder="Search by email…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-[46px] w-full border-0 bg-transparent text-sm outline-none placeholder:text-[var(--muted-soft)]"
            />
          </div>

          <button
            type="button"
            onClick={() => downloadCsv(leads, flowName)}
            className="inline-flex min-h-[46px] shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-[0_8px_20px_-8px_var(--primary)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <DownloadIcon className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {visible.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-col gap-3 rounded-[24px] border-[1.5px] border-[var(--line)] bg-white p-4"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <MailChip />
              <span className="truncate font-semibold">{lead.email}</span>
            </div>
            <p className="m-0 text-xs text-[var(--muted-soft)]">
              {formatDate(lead.collected_at)} {formatTime(lead.collected_at)}
            </p>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="flex items-center justify-center gap-2 rounded-[24px] border-[1.5px] border-[var(--line)] px-5 py-14 text-sm text-[var(--muted)]">
            <SearchIcon className="h-4 w-4" />
            No emails match your search.
          </p>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-[30px] border-[1.5px] border-[var(--line)] bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="border-b-[1.5px] border-[var(--line)] bg-[var(--bg)]">
              <tr>
                <th className={HEAD_CLASS}>Email</th>
                <th className={HEAD_CLASS}>Collected at</th>
              </tr>
            </thead>
            <tbody className="divide-y-[1.5px] divide-[var(--line)]">
              {visible.map((lead) => (
                <tr key={lead.id} className="transition-colors hover:bg-[var(--bg)]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <MailChip />
                      <span className="font-semibold">{lead.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="m-0 text-[var(--ink)]">{formatDate(lead.collected_at)}</p>
                    <p className="m-0 text-xs text-[var(--muted-soft)]">{formatTime(lead.collected_at)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-[var(--muted)]">
            <SearchIcon className="h-4 w-4" />
            No emails match your search.
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
    </div>
  );
}
