import { Reveal } from "../Reveal";
import { displayFont } from "./fonts";

const CHIP_DELAYS = [0, 0.6, 1.2, 1.8];
const KEYWORDS = ["guide", "link", "send", "info"];

export function HomeHowItWorks() {
  return (
    <div
      id="how"
      className="mx-auto flex max-w-[1920px] flex-col gap-14 px-6 py-20 sm:px-8 sm:py-[104px]"
    >
      <div className="flex flex-col items-start gap-3.5">
        <span className="text-sm font-bold tracking-[0.08em] text-[var(--violet)] uppercase">
          How it works
        </span>
        <h2
          className={`${displayFont} m-0 max-w-[720px] text-4xl leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[54px] sm:leading-[1.05]`}
        >
          Three steps, then it runs itself
        </h2>
      </div>
      <div className="flex flex-wrap gap-6">
        <Reveal className="ha-lift min-w-0 flex-1 basis-[300px] rounded-[32px] border border-[var(--line)] bg-white p-9">
          <div className="flex flex-col gap-4.5">
            <div className={`${displayFont} text-6xl leading-none font-extrabold tracking-[-0.04em] text-[var(--accent)] sm:text-[72px]`}>
              01
            </div>
            <h3 className={`${displayFont} m-0 text-[28px] font-bold tracking-[-0.02em]`}>
              Connect Instagram
            </h3>
            <p className="m-0 text-[var(--muted)]">
              Sign in with Instagram OAuth. Add more than one account
              whenever you need to.
            </p>
            <div className="mt-auto pt-3">
              <div className="ha-pulsering inline-flex min-h-12 items-center gap-2.5 rounded-full bg-[var(--accent)] px-5 text-[15px] font-semibold text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>
                <span>Account connected</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80} className="ha-lift min-w-0 flex-1 basis-[300px] rounded-[32px] border border-[var(--line)] bg-white p-9">
          <div className="flex flex-col gap-4.5">
            <div className={`${displayFont} text-6xl leading-none font-extrabold tracking-[-0.04em] text-[var(--violet)] sm:text-[72px]`}>
              02
            </div>
            <h3 className={`${displayFont} m-0 text-[28px] font-bold tracking-[-0.02em]`}>
              Create an automation
            </h3>
            <p className="m-0 text-[var(--muted)]">
              Choose a trigger, add your keywords, write the DM and attach
              up to three link buttons.
            </p>
            <div className="mt-auto flex min-h-11 flex-wrap gap-2 pt-3">
              {KEYWORDS.map((kw, i) => (
                <span
                  key={kw}
                  className="rounded-full bg-[var(--tint2)] px-4 py-1.5 text-sm font-bold text-[var(--violet)]"
                  style={{ animation: "haChipLoop 7s ease-out infinite", animationDelay: `${CHIP_DELAYS[i]}s`, opacity: i === 0 ? undefined : 0 }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={160} className="ha-lift min-w-0 flex-1 basis-[300px] rounded-[32px] bg-[var(--ink)] p-9 text-white">
          <div className="flex flex-col gap-4.5">
            <div className={`${displayFont} text-6xl leading-none font-extrabold tracking-[-0.04em] text-[var(--secondary)] sm:text-[72px]`}>
              03
            </div>
            <h3 className={`${displayFont} m-0 text-[28px] font-bold tracking-[-0.02em]`}>
              Activate
            </h3>
            <p className="m-0 text-[var(--muted-faint)]">
              Switch it on. Every matching comment, reply or share gets a
              DM, day and night.
            </p>
            <div className="mt-auto flex items-center gap-3.5 pt-3">
              <div className="relative h-8 w-14 rounded-full p-1" style={{ animation: "haKnobBg 6s ease-in-out infinite" }}>
                <div className="h-6 w-6 rounded-full bg-white" style={{ animation: "haKnob 6s ease-in-out infinite" }} />
              </div>
              <span className="inline-flex items-center gap-2 text-[15px] font-bold text-[#9BE3C6]">
                <span className="ha-pdot h-2 w-2 rounded-full bg-[var(--success)]" />
                Rule is live
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
