"use client";

import { secondaryButtonClass } from "../components/styles";
import { formatDate, formatTime } from "../components/format";

export interface LeadRow {
  id: string;
  ig_sender_id: string;
  email: string;
  collected_at: string;
}

const HEAD_CLASS =
  "px-5 py-3 text-left text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase";

function toCsv(leads: LeadRow[]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const header = "email,ig_sender_id,collected_at";
  const rows = leads.map((lead) =>
    [lead.email, lead.ig_sender_id, lead.collected_at].map(escape).join(",")
  );
  return [header, ...rows].join("\n");
}

function downloadCsv(leads: LeadRow[], flowName: string) {
  const blob = new Blob([toCsv(leads)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${flowName.trim().toLowerCase().replaceAll(/\s+/g, "-")}-leads.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function LeadsTable({
  leads,
  flowName,
}: {
  leads: LeadRow[];
  flowName: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {leads.length} email{leads.length === 1 ? "" : "s"} collected
        </p>
        <button
          type="button"
          onClick={() => downloadCsv(leads, flowName)}
          className={secondaryButtonClass}
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/6 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-black/6 bg-zinc-50/70 dark:border-white/8 dark:bg-white/3">
              <tr>
                <th className={HEAD_CLASS}>Email</th>
                <th className={HEAD_CLASS}>Sender ID</th>
                <th className={HEAD_CLASS}>Collected at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 dark:divide-white/8">
              {leads.map((lead) => (
                <tr key={lead.id} className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/3">
                  <td className="px-5 py-4 font-medium">{lead.email}</td>
                  <td className="px-5 py-4 font-mono text-xs text-zinc-500">
                    {lead.ig_sender_id}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="text-zinc-600 dark:text-zinc-300">
                      {formatDate(lead.collected_at)}
                    </p>
                    <p className="text-xs text-zinc-400">{formatTime(lead.collected_at)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
