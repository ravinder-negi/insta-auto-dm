import Link from "next/link";
import type { ReactNode } from "react";
import { AlertIcon, ArrowRightIcon, CheckIcon, MailIcon, PlusIcon } from "@/components/icons";
import { ChartCard } from "@/features/analytics/components/chart-primitives";
import { ConnectAccountButton } from "@/features/accounts/components/ConnectAccountButton";
import { NewRuleButton } from "@/features/rules/components/NewRuleButton";
import { compactNumber } from "@/features/analytics/lib/metrics";
import { formatRelative } from "@/lib/utils/format";
import type { AttentionItem, ChecklistStep, RecentLead } from "../lib/summary";

const ctaClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 py-2 text-xs font-bold text-[var(--ink)] transition-colors hover:bg-[var(--secondary-soft-bg)]";

export function GettingStarted({ steps }: { steps: ChecklistStep[] }) {
  const doneCount = steps.filter((step) => step.done).length;
  // Only the first unfinished step gets a button, so there's one clear next move.
  const nextKey = steps.find((step) => !step.done)?.key;

  const action: Record<ChecklistStep["key"], ReactNode> = {
    connect: (
      <ConnectAccountButton className={ctaClass}>
        <PlusIcon className="h-3.5 w-3.5" />
        Connect Instagram
      </ConnectAccountButton>
    ),
    create: (
      <NewRuleButton className={ctaClass}>
        <PlusIcon className="h-3.5 w-3.5" />
        Create AutoDM
      </NewRuleButton>
    ),
    test: (
      <Link href="/dashboard/rules" className={ctaClass}>
        See your AutoDMs
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    ),
  };

  return (
    <ChartCard
      title="Get started"
      description={`${doneCount} of ${steps.length} done. Finish these and your first automatic DM goes out.`}
    >
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className="flex flex-wrap items-center gap-4 rounded-[22px] border-[1.5px] border-[var(--line)] p-4"
            style={step.done ? { backgroundColor: "var(--success-tint)", borderColor: "transparent" } : undefined}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
              style={
                step.done
                  ? { backgroundColor: "var(--success)", color: "#fff" }
                  : { backgroundColor: "var(--tint2)", color: "var(--violet)" }
              }
            >
              {step.done ? <CheckIcon className="h-4 w-4" /> : index + 1}
            </span>
            <div className="min-w-0 flex-1 basis-[220px]">
              <p
                className="m-0 text-sm font-bold"
                style={{ color: "var(--ink)", textDecoration: step.done ? "line-through" : undefined }}
              >
                {step.title}
              </p>
              {!step.done && <p className="m-0 mt-0.5 text-sm text-[var(--muted)]">{step.detail}</p>}
            </div>
            {step.key === nextKey && action[step.key]}
          </li>
        ))}
      </ol>
    </ChartCard>
  );
}

export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  return (
    <ChartCard title="Needs attention" description="Things that stop DMs from going out.">
      {items.length === 0 ? (
        <p className="m-0 flex items-center gap-2.5 rounded-[22px] p-4 text-sm font-semibold" style={{ backgroundColor: "var(--success-tint)", color: "var(--success-text)" }}>
          <CheckIcon className="h-4 w-4 shrink-0" />
          All good. Nothing needs your attention.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex flex-wrap items-center gap-3.5 rounded-[22px] p-4"
              style={{ backgroundColor: item.tone === "danger" ? "var(--danger-tint-faint)" : "var(--warning-tint)" }}
            >
              <span className="shrink-0" style={{ color: item.tone === "danger" ? "var(--danger-strong)" : "var(--warning-text)" }}>
                <AlertIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 basis-[200px]">
                <p className="m-0 text-sm font-bold" style={{ color: "var(--ink)" }}>
                  {item.title}
                </p>
                <p className="m-0 mt-0.5 text-xs text-[var(--muted)]">{item.detail}</p>
              </div>
              <Link href={item.href} className={ctaClass}>
                {item.cta}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

export function TopAutoDms({
  rows,
}: {
  rows: { ruleId: string; name: string; accountHandle: string; dmsSent: number }[];
}) {
  return (
    <ChartCard
      title="Top AutoDMs"
      description="By DMs delivered in the last 7 days."
      action={
        <Link href="/dashboard/rules/analytics" className={ctaClass}>
          Analytics
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="m-0 text-sm text-[var(--muted)]">No AutoDMs were delivered in the last 7 days.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {rows.map((row, index) => (
            <li key={row.ruleId} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--tint)] text-xs font-extrabold text-[var(--primary)]">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{row.name}</span>
                <span className="block truncate text-xs text-[var(--muted)]">@{row.accountHandle}</span>
              </span>
              <span className="shrink-0 text-sm font-extrabold">
                {compactNumber(row.dmsSent)}
                <span className="ml-1 text-xs font-semibold text-[var(--muted)]">DMs</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </ChartCard>
  );
}

export function RecentLeads({ leads, now }: { leads: RecentLead[]; now: number }) {
  return (
    <ChartCard title="Recent leads" description="Newest emails from AutoDMs, DM Flows and lead magnets.">
      {leads.length === 0 ? (
        <p className="m-0 text-sm text-[var(--muted)]">
          No emails yet. Turn on &ldquo;Collect email&rdquo; in an AutoDM, or add a lead magnet to your link-in-bio.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {leads.map((lead) => (
            <li key={`${lead.href}:${lead.email}:${lead.collectedAt}`}>
              <Link href={lead.href} className="flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-[var(--bg)]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--neutral-tint)] text-[var(--muted)]">
                  <MailIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{lead.email}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">{lead.source}</span>
                </span>
                <span className="shrink-0 text-xs text-[var(--muted-soft)]">
                  {formatRelative(lead.collectedAt, now)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
