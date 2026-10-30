import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon, ClockIcon } from "@/components/icons";
import { currentTimestamp } from "@/lib/utils/format";
import {
  FlowSessionsTable,
  type FlowSessionRow,
} from "@/features/flows/components/FlowSessionsTable";
import { displayFont, linkInBioCssVars, linkInBioWrapperClass } from "@/lib/linkInBioTheme";

type SessionQueryRow = {
  id: string;
  flow_id: string;
  ig_sender_id: string;
  current_step_order: number;
  status: string;
  started_at: string;
  last_interaction_at: string;
  dm_flows: { name: string } | null;
};

export default async function FlowsExecutionsPage() {
  const supabase = await createClient();

  const [{ data, error }, { data: steps }] = await Promise.all([
    supabase
      .from("dm_flow_sessions")
      .select(
        "id, flow_id, ig_sender_id, current_step_order, status, started_at, last_interaction_at, dm_flows(name)"
      )
      .order("last_interaction_at", { ascending: false })
      .limit(200),
    supabase.from("dm_flow_steps").select("flow_id, step_order"),
  ]);

  // Highest step_order per flow — each flow has its own step count.
  const totalStepsByFlow = new Map<string, number>();
  for (const step of steps ?? []) {
    const current = totalStepsByFlow.get(step.flow_id) ?? 0;
    if (step.step_order > current) totalStepsByFlow.set(step.flow_id, step.step_order);
  }

  const sessions = (data as unknown as SessionQueryRow[]) ?? [];

  const rows: FlowSessionRow[] = sessions.map((session) => ({
    id: session.id,
    flowName: session.dm_flows?.name ?? "Deleted flow",
    ig_sender_id: session.ig_sender_id,
    current_step_order: session.current_step_order,
    totalSteps: totalStepsByFlow.get(session.flow_id) ?? null,
    status: session.status,
    started_at: session.started_at,
    last_interaction_at: session.last_interaction_at,
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
            style={{ background: "var(--tint)" }}
          />
          <div
            className="animate-float-delayed pointer-events-none absolute -top-20 -right-24 h-[420px] w-[420px] rounded-full opacity-80 blur-[100px]"
            style={{ background: "var(--secondary-pale-border)" }}
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
              Flow execution{" "}
              <span className="relative inline-block text-[var(--accent)]">
                log
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
              Every conversation started by a DM flow, newest first.
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-2xl border-[1.5px] border-[var(--danger-border)] bg-[var(--danger-tint-faint)] px-4 py-3 text-sm font-semibold text-[var(--danger-deep)]"
          >
            {error.message}
          </p>
        )}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[36px] border-[1.5px] border-dashed border-[var(--secondary-border)] bg-[var(--secondary-faint-bg)] px-7 py-14 text-center">
            <span className="animate-float flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[var(--violet)] text-white">
              <ClockIcon className="h-[34px] w-[34px]" />
            </span>
            <h3 className={`m-0 ${displayFont} text-[28px] font-extrabold tracking-[-0.03em]`}>
              No conversations yet
            </h3>
            <p className="m-0 max-w-[380px] text-[var(--muted)]">
              Once someone comments a flow&apos;s trigger keyword, their conversation shows up here.
            </p>
          </div>
        ) : (
          <FlowSessionsTable sessions={rows} now={currentTimestamp()} />
        )}
      </div>
    </div>
  );
}
