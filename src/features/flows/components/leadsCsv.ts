import type { LeadRow } from "./LeadsTable";

export function toCsv(leads: LeadRow[]) {
  // Lead-magnet emails come from a public form, so a value like
  // `=HYPERLINK(...)&"@a.b"` can reach here; a leading ' stops Excel and
  // Sheets from running it as a formula.
  const escape = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const withSender = leads.some((lead) => lead.ig_sender_id);
  const header = withSender ? "email,ig_sender_id,collected_at" : "email,collected_at";
  const rows = leads.map((lead) =>
    (withSender
      ? [lead.email, lead.ig_sender_id ?? "", lead.collected_at]
      : [lead.email, lead.collected_at]
    )
      .map(escape)
      .join(",")
  );
  return [header, ...rows].join("\n");
}
