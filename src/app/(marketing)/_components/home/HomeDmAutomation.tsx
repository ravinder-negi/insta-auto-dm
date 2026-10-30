import { Reveal } from "../Reveal";
import { displayFont } from "./fonts";

const POINTS = [
  "Up to 20 keywords, plus exclusions, or reply to any comment",
  "Set a delay so replies feel natural",
  "Up to 3 link buttons and image attachments",
  "Public comment auto-replies with up to 3 variants",
];

function Check() {
  return (
    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--accent)] text-white">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>
    </span>
  );
}

export function HomeDmAutomation() {
  return (
    <div
      id="features"
      className="mx-auto flex max-w-[1920px] flex-wrap items-center gap-16 px-6 pt-20 pb-10 sm:px-8 sm:pt-28 sm:pb-14"
    >
      <Reveal className="flex min-w-0 flex-1 basis-[440px] flex-col items-start gap-6">
        <span className="text-sm font-bold tracking-[0.08em] text-[var(--accent)] uppercase">
          DM automation
        </span>
        <h2
          className={`${displayFont} m-0 text-4xl leading-[1.06] font-extrabold tracking-[-0.03em] sm:text-[46px]`}
        >
          Auto-DMs that sound like you
        </h2>
        <p className="m-0 text-lg text-[var(--muted)]">
          Decide exactly who gets a message, when it lands and what it
          says. Pair it with a public reply so the comment thread looks
          alive too.
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

      <Reveal
        delay={120}
        className="ha-lift flex min-w-0 flex-1 basis-[440px] flex-col gap-5 rounded-[32px] border border-[var(--line)] bg-white p-7 shadow-[0_30px_60px_-30px_color-mix(in srgb, var(--ink) 30%, transparent)]"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <div className={`${displayFont} text-xl font-bold`}>
              Rule: Free guide
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--success-tint)] px-3 py-1.5 text-[13px] font-bold text-[var(--success-text)]">
              <span className="ha-pdot h-1.75 w-1.75 rounded-full bg-[var(--success)]" />
              Active
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-bold text-[var(--muted)]">
              Trigger
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-3 font-semibold">
              Comment keyword
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-bold text-[var(--muted)]">
              Keywords
            </div>
            <div className="flex flex-wrap gap-2">
              {["guide", "link", "send", "info"].map((kw) => (
                <span
                  key={kw}
                  className="ha-chiphover rounded-full bg-[var(--tint2)] px-3.5 py-1.5 text-sm font-semibold text-[var(--violet)]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-bold text-[var(--muted)]">
              Exclude
            </div>
            <div className="flex flex-wrap gap-2">
              {["no thanks", "spam"].map((kw) => (
                <span
                  key={kw}
                  className="ha-chiphover rounded-full bg-[var(--neutral-tint)] px-3.5 py-1.5 text-sm font-semibold text-[var(--neutral-text)]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex min-w-0 flex-1 basis-[140px] flex-col gap-2">
              <div className="text-[13px] font-bold text-[var(--muted)]">
                Reply delay
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-3 font-semibold">
                10 seconds
              </div>
            </div>
            <div className="flex min-w-0 flex-1 basis-[140px] flex-col gap-2">
              <div className="text-[13px] font-bold text-[var(--muted)]">
                Link buttons
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-3 font-semibold">
                1 of 3 used
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[13px] font-bold text-[var(--muted)]">
              Message
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3.5 text-[15px] leading-[1.45]">
              Hey {"{first_name}"}! Thanks for commenting. Here is your
              free guide.
              <span className="ha-caret text-[var(--accent)]" />
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
