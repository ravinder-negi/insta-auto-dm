import { Reveal } from "../Reveal";
import { displayFont } from "./fonts";

const POINTS = [
  "Branch on yes, no — or a custom list of numbered options",
  "Add a timed follow-up nudge to keep the thread going",
  "Set each follow-up delay in hours",
  "Flow analytics and execution logs for every run",
];

function Check() {
  return (
    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--violet)] text-white">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>
    </span>
  );
}

export function HomeFlows() {
  return (
    <div className="mx-auto flex max-w-[1920px] flex-wrap-reverse items-center gap-16 px-6 pt-10 pb-20 sm:px-8 sm:pt-14 sm:pb-28">
      <Reveal className="flex min-w-0 flex-1 basis-[440px] flex-col items-center rounded-[32px] bg-[var(--secondary-soft-bg)] p-8">
        <div className="rounded-full bg-[var(--violet)] px-5 py-2.5 text-sm font-bold text-white">
          Trigger: story reply
        </div>
        <div className="relative h-6 w-0.5 bg-[#BFB5E8]">
          <span className="ha-tdot" />
        </div>
        <div className="flex w-full max-w-[360px] flex-col gap-1.5 rounded-2xl border border-[var(--line)] bg-white px-4.5 py-4 text-center">
          <div className="text-xs font-bold tracking-[0.06em] text-[var(--muted)] uppercase">
            Send DM
          </div>
          <div className="font-semibold">Want the free checklist?</div>
        </div>
        <div className="relative h-6 w-0.5 bg-[#BFB5E8]">
          <span className="ha-tdot" style={{ animationDelay: ".8s" }} />
        </div>
        <div className="flex w-full flex-wrap items-stretch gap-3">
          <div className="flex min-w-0 flex-1 basis-[120px] flex-col items-center gap-2.5">
            <span className="rounded-full bg-[var(--success-tint)] px-4 py-1.5 text-[13px] font-bold text-[var(--success-text)]">
              Yes
            </span>
            <div className="ha-gl1 flex-1 rounded-2xl border-[1.5px] border-[var(--line)] bg-white p-3.5 text-center text-sm">
              Send the checklist with link buttons
            </div>
            <div className="h-4.5 w-0.5 bg-[#BFB5E8]" />
            <div className="w-full rounded-2xl bg-[var(--warning-tint)] px-3 py-2.5 text-center text-[13px] font-semibold text-[#5A3A00]">
              Follow-up after 2 hours
            </div>
          </div>
          <div className="flex min-w-0 flex-1 basis-[120px] flex-col items-center gap-2.5">
            <span className="rounded-full bg-[var(--neutral-tint)] px-4 py-1.5 text-[13px] font-bold text-[var(--neutral-text)]">
              No
            </span>
            <div className="ha-gl2 flex-1 rounded-2xl border-[1.5px] border-[var(--line)] bg-white p-3.5 text-center text-sm">
              Say thanks and end the flow
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={120} className="flex min-w-0 flex-1 basis-[440px] flex-col items-start gap-6">
        <span className="text-sm font-bold tracking-[0.08em] text-[var(--violet)] uppercase">
          Flows and follow-ups
        </span>
        <h2
          className={`${displayFont} m-0 text-4xl leading-[1.06] font-extrabold tracking-[-0.03em] sm:text-[46px]`}
        >
          Conversations that branch on the reply
        </h2>
        <p className="m-0 text-lg text-[var(--muted)]">
          Go beyond a single message. Ask a question and send people down
          the right path based on what they answer.
        </p>
        <div className="flex w-full flex-col gap-3.5">
          {POINTS.map((point) => (
            <div key={point} className="flex items-start gap-3">
              <Check />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
