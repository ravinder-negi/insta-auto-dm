import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "@/components/icons";
import { currentTimestamp } from "@/lib/utils/format";
import { FlowsAnalyticsDashboard } from "@/features/flows/components/FlowsAnalyticsDashboard";
import { displayFont, linkInBioCssVars, linkInBioWrapperClass } from "@/lib/linkInBioTheme";

type FlowQueryRow = {
  id: string;
  name: string;
  is_active: boolean;
  instagram_account_id: string | null;
  instagram_accounts: { username: string | null; instagram_user_id: string } | null;
};

export default async function FlowsAnalyticsPage() {
  const supabase = await createClient();

  const [
    { data: flows },
    { data: accountsData },
    { data: sessions },
    { data: steps },
    { data: leads },
  ] = await Promise.all([
    supabase
      .from("dm_flows")
      .select(
        "id, name, is_active, instagram_account_id, instagram_accounts(username, instagram_user_id)"
      ),
    supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("dm_flow_sessions")
      .select("id, flow_id, instagram_account_id, status, current_step_order, started_at"),
    supabase.from("dm_flow_steps").select("flow_id, step_order"),
    supabase.from("dm_flow_leads").select("id, flow_id, instagram_account_id, collected_at"),
  ]);

  const flowInfos = ((flows as unknown as FlowQueryRow[]) ?? []).map((flow) => ({
    id: flow.id,
    name: flow.name,
    accountId: flow.instagram_account_id,
    accountHandle:
      flow.instagram_accounts?.username ??
      flow.instagram_accounts?.instagram_user_id ??
      "unknown",
    isActive: flow.is_active,
  }));

  const accounts = (accountsData ?? []).map((account) => ({
    id: account.id as string,
    handle: (account.username ?? account.instagram_user_id) as string,
  }));

  const sessionInfos = (sessions ?? []).map((session) => ({
    id: session.id as string,
    flowId: session.flow_id as string,
    accountId: session.instagram_account_id as string | null,
    status: session.status as string,
    currentStepOrder: session.current_step_order as number,
    startedAt: session.started_at as string,
  }));

  const stepInfos = (steps ?? []).map((step) => ({
    flowId: step.flow_id as string,
    stepOrder: step.step_order as number,
  }));

  const leadInfos = (leads ?? []).map((lead) => ({
    id: lead.id as string,
    flowId: lead.flow_id as string,
    accountId: lead.instagram_account_id as string | null,
    collectedAt: lead.collected_at as string,
  }));

  return (
    <div className={linkInBioWrapperClass} style={linkInBioCssVars}>
      <div className="flex flex-col gap-7">
        <Link
          href="/dashboard/flows"
          className="inline-flex w-fit items-center gap-2 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--secondary-soft-bg)]"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to flows
        </Link>

        {/* hero */}
        <div className="relative overflow-hidden rounded-[40px] border border-[var(--line)] bg-white bg-[radial-gradient(#DDD6EC_1.2px,transparent_1.2px)] bg-[length:30px_30px]">
          <div
            className="animate-float pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full opacity-70 blur-[90px]"
            style={{ background: "var(--secondary-pale-border)" }}
          />
          <div
            className="animate-float-delayed pointer-events-none absolute -top-20 -right-24 h-[420px] w-[420px] rounded-full opacity-80 blur-[100px]"
            style={{ background: "var(--tint)" }}
          />
          <div className="relative flex flex-col gap-3.5 p-9 sm:p-11">
            <span className="animate-fade-in-up inline-flex w-fit items-center gap-2.5 rounded-full border border-[var(--line)] bg-white py-[7px] pr-4 pl-3 text-xs font-bold tracking-[0.1em] text-[var(--muted)] uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
              </span>
              Automation
            </span>
            <h1
              className={`animate-fade-in-up m-0 ${displayFont} text-[clamp(32px,4.2vw,48px)] leading-[1.03] font-extrabold tracking-[-0.035em]`}
              style={{ animationDelay: "0.1s" }}
            >
              Flow{" "}
              <span className="relative inline-block text-[var(--accent)]">
                analytics
                <svg
                  className="absolute bottom-[-6px] left-0 h-3.5 w-full"
                  viewBox="0 0 200 14"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9 C 40 2, 90 14, 198 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p
              className="animate-fade-in-up m-0 max-w-[540px] text-lg text-[var(--muted)]"
              style={{ animationDelay: "0.2s" }}
            >
              How far people get through your DM flows, which ones perform best, and what
              they&apos;ve collected.
            </p>
          </div>
        </div>

        <FlowsAnalyticsDashboard
          flows={flowInfos}
          accounts={accounts}
          sessions={sessionInfos}
          steps={stepInfos}
          leads={leadInfos}
          now={currentTimestamp()}
        />
      </div>
    </div>
  );
}
