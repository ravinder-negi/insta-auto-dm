import Link from "next/link";
import { CheckIcon, ExternalLinkIcon, MailIcon, PlusIcon } from "@/components/icons";
import { NewRuleButton } from "@/features/rules/components/NewRuleButton";
import { NewFlowButton } from "@/features/flows/components/NewFlowButton";

const RING_CIRCUMFERENCE = 339.3; // 2 * PI * 54, the SVG arc radius below

const ghostButtonClass =
  "inline-flex min-h-[54px] cursor-pointer items-center gap-2.5 rounded-full border border-white/20 bg-white/8 px-6 text-base font-bold text-white transition-colors hover:bg-white/15";
const pillStyle = { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.08)" };

/** Dark hero for the Home page, in the same visual language as AccountsHero:
 *  greeting and actions on the left, this week's delivery ring on the right. */
export function HomeHero({
  firstName,
  delivered,
  failed,
  leads,
  clicks,
  publicProfileHref,
}: {
  firstName: string | undefined;
  delivered: number;
  failed: number;
  leads: number;
  /** Link-in-bio clicks. */
  clicks: number;
  publicProfileHref: string | null;
}) {
  const attempted = delivered + failed;
  const deliveredLen = attempted ? (delivered / attempted) * RING_CIRCUMFERENCE : 0;
  const failedLen = attempted ? (failed / attempted) * RING_CIRCUMFERENCE : 0;
  const rate = attempted ? Math.round((delivered / attempted) * 100) : null;

  return (
    <div
      className="relative overflow-hidden rounded-[40px] text-white"
      style={{
        backgroundColor: "var(--ink)",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1.2px,transparent 1.2px)",
        backgroundSize: "30px 30px",
      }}
    >
      <div
        aria-hidden="true"
        className="animate-float pointer-events-none absolute -top-36 -left-24 h-[420px] w-[420px] rounded-full opacity-38 blur-[120px]"
        style={{ backgroundColor: "var(--primary)" }}
      />
      <div
        aria-hidden="true"
        className="animate-float-delayed pointer-events-none absolute -right-20 -bottom-40 h-[460px] w-[460px] rounded-full opacity-50 blur-[120px]"
        style={{ backgroundColor: "var(--violet)" }}
      />

      <div className="relative flex flex-wrap items-center gap-10 p-8 sm:p-12">
        <div className="flex min-w-0 flex-1 basis-[380px] flex-col items-start gap-5">
          <span
            className="inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-3 text-xs font-bold tracking-widest uppercase"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "#E4DEF7" }}
          >
            <span className="animate-pulse-soft h-2 w-2 rounded-full" style={{ backgroundColor: "var(--violet)" }} />
            Overview
          </span>
          <h1 className="text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.05] font-extrabold tracking-tight">
            {firstName ? "Hey, " : "Your week, on "}
            <span className="relative inline-block" style={{ color: "var(--secondary)" }}>
              {firstName ? `${firstName} 👋` : "autopilot"}
            </span>
          </h1>
          <p className="max-w-md text-lg" style={{ color: "var(--muted-faint)" }}>
            How your automations and link-in-bio did over the last 7 days.
          </p>
          <div className="flex flex-wrap gap-3">
            <NewRuleButton
              className="inline-flex min-h-[54px] cursor-pointer items-center gap-2.5 rounded-full bg-[var(--primary)] px-7 text-base font-bold text-white shadow-[0_16px_30px_-12px_color-mix(in_srgb,var(--primary)_60%,transparent)] transition-transform hover:scale-[1.02]"
            >
              <PlusIcon className="h-4.5 w-4.5" />
              New AutoDM
            </NewRuleButton>
            <NewFlowButton className={ghostButtonClass}>
              <PlusIcon className="h-4.5 w-4.5" />
              New DM Flow
            </NewFlowButton>
            {publicProfileHref && (
              <Link href={publicProfileHref} target="_blank" className={ghostButtonClass}>
                <ExternalLinkIcon className="h-4.5 w-4.5" />
                View link-in-bio
              </Link>
            )}
          </div>
        </div>

        <div className="relative flex min-w-0 flex-1 basis-[280px] flex-col items-center gap-5">
          {leads > 0 && (
            <div
              aria-hidden="true"
              className="animate-float-pill absolute -top-4 right-0 z-10 hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.45)] sm:flex"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: "var(--tint)" }}>
                <MailIcon className="h-3.5 w-3.5 text-[var(--violet)]" />
              </span>
              New lead!
            </div>
          )}
          {delivered > 0 && (
            <div
              aria-hidden="true"
              className="animate-float-pill-delayed absolute top-16 -left-6 z-10 hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_16px_30px_-12px_rgba(0,0,0,0.45)] sm:flex"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3DD9A0]/15">
                <CheckIcon className="h-3.5 w-3.5 text-[#3DD9A0]" />
              </span>
              DM delivered!
            </div>
          )}
          <div className="relative h-[180px] w-[180px]">
            <svg width="180" height="180" viewBox="0 0 140 140" aria-hidden="true" className="-rotate-90">
              <circle cx="70" cy="70" r="54" fill="none" strokeWidth="13" stroke="rgba(255,255,255,0.1)" />
              {/* A zero-length arc with round caps still draws a dot. */}
              {deliveredLen > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  strokeWidth="13"
                  strokeLinecap="round"
                  stroke="#3DD9A0"
                  strokeDasharray={`${deliveredLen} ${RING_CIRCUMFERENCE}`}
                  className="transition-[stroke-dasharray] duration-700 ease-out"
                />
              )}
              {failedLen > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  strokeWidth="13"
                  strokeLinecap="round"
                  stroke="#F5B84B"
                  strokeDasharray={`${failedLen} ${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={-deliveredLen}
                  className="transition-[stroke-dasharray] duration-700 ease-out"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-[2.6rem] font-extrabold tracking-tight">
                {rate === null ? "—" : rate}
                {rate !== null && (
                  <span className="text-2xl" style={{ color: "var(--muted-faint)" }}>
                    %
                  </span>
                )}
              </span>
              <span className="mt-1.5 text-[13px] font-semibold" style={{ color: "var(--muted-faint)" }}>
                {rate === null ? "no DMs yet" : "delivered"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <span className="rounded-full border px-4 py-2 text-sm font-semibold" style={pillStyle}>
              <span style={{ color: "#3DD9A0" }}>●</span> {delivered} delivered
            </span>
            <span className="rounded-full border px-4 py-2 text-sm font-semibold" style={pillStyle}>
              <span style={{ color: "#F5B84B" }}>●</span> {failed} failed
            </span>
            <span className="rounded-full border px-4 py-2 text-sm font-semibold" style={pillStyle}>
              <span style={{ color: "var(--violet)" }}>●</span> {leads} lead{leads === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border px-4 py-2 text-sm font-semibold" style={pillStyle}>
              <span style={{ color: "#7CC4FA" }}>●</span> {clicks} link click{clicks === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
