import { Reveal } from "../Reveal";
import { displayFont } from "./fonts";

const REPLY_ROWS = [
  { name: "@sam.fit", delay: 0 },
  { name: "@priya.d", delay: 0.8 },
  { name: "@alex.t", delay: 1.6 },
];

const HOUR_DELAYS = [0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3, 3.3];

const PERF_BARS = [
  { h: "40%", bg: "#E0B25A", delay: 0 },
  { h: "62%", bg: "#E0B25A", delay: 0.15 },
  { h: "50%", bg: "#E0B25A", delay: 0.3 },
  { h: "84%", bg: "#E0B25A", delay: 0.45 },
  { h: "100%", bg: "var(--warning-text)", delay: 0.6 },
];

export function HomeValueProps() {
  return (
    <div className="border-t border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-12 px-6 py-20 sm:px-8 sm:py-[104px]">
        <h2
          className={`${displayFont} m-0 max-w-[760px] text-4xl leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[54px] sm:leading-[1.05]`}
        >
          Less replying. More relationships.
        </h2>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-5">
            <Reveal className="ha-lift min-h-[320px] min-w-0 flex-[1.4_1_420px] justify-between rounded-[32px] bg-[var(--tint)] p-9">
              <div className="flex h-full flex-col justify-between gap-5">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>
                </span>
                <div className="flex max-w-[340px] flex-col gap-2">
                  {REPLY_ROWS.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 text-sm font-semibold"
                      style={{ animation: "haRowLoop 6s ease-out infinite", animationDelay: `${row.delay}s`, opacity: row.delay === 0 ? undefined : 0 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>
                      Reply sent to {row.name}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className={`${displayFont} m-0 text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]`}>
                    Save time
                  </h3>
                  <p className="m-0 max-w-[460px] text-[#4A3540]">
                    Stop typing the same answer all day. Set up a rule once
                    and let it handle the repeat questions for you.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal
              delay={80}
              className="ha-lift min-h-[320px] min-w-0 flex-1 basis-[300px] rounded-[32px] bg-[var(--tint2)] p-9"
            >
              <div className="flex h-full flex-col justify-between gap-5">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[var(--violet)] text-white">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"></path></svg>
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex h-11 items-end gap-1.5">
                    {HOUR_DELAYS.map((d, i) => (
                      <span
                        key={i}
                        className="h-full flex-1 rounded"
                        style={{ transformOrigin: "bottom", animation: "haHourOn 3.6s ease-in-out infinite", animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                  <div className="text-[13px] font-bold text-[#3B3560]">
                    Always on, around the clock
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className={`${displayFont} m-0 text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]`}>
                    Instant, 24/7 replies
                  </h3>
                  <p className="m-0 text-[#3B3560]">
                    Your audience gets an answer the moment they engage,
                    even while you sleep.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
          <div className="flex flex-wrap gap-5">
            <Reveal className="ha-lift min-h-[320px] min-w-0 flex-1 basis-[300px] rounded-[32px] bg-[var(--success-tint)] p-9">
              <div className="flex h-full flex-col justify-between gap-5">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[var(--success-text)] text-white">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"></path><path d="M17 5.5a3.2 3.2 0 0 1 0 6M18.5 14.8c1.7.6 2.7 2.3 3 5.2"></path></svg>
                </span>
                <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-white px-3.5 py-3 text-sm font-semibold">
                  <span>
                    maya@email.com
                    <span className="ha-caret" />
                  </span>
                  <span
                    className="rounded-full bg-[var(--success-tint)] px-2.5 py-0.5 text-xs font-bold text-[var(--success-text)]"
                    style={{ animation: "haChipLoop 5s ease-out infinite" }}
                  >
                    Unlocked
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className={`${displayFont} m-0 text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]`}>
                    Capture leads
                  </h3>
                  <p className="m-0 text-[#24503F]">
                    Ask for a follow or an email before you deliver, and
                    keep every lead in a list per rule.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal
              delay={80}
              className="ha-lift min-h-[320px] min-w-0 flex-[1.4_1_420px] rounded-[32px] bg-[var(--warning-tint)] p-9"
            >
              <div className="flex h-full flex-col justify-between gap-5">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[var(--warning-text)] text-white">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></svg>
                </span>
                <div className="flex h-17.5 items-end gap-2.5 border-b-2 border-[#E8D3A4]">
                  {PERF_BARS.map((bar, i) => (
                    <span
                      key={i}
                      className="ha-bar flex-1 rounded-t"
                      style={{ height: bar.h, background: bar.bg, animationDelay: `${bar.delay}s` }}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className={`${displayFont} m-0 text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]`}>
                    Track performance
                  </h3>
                  <p className="m-0 max-w-[460px] text-[#5A4520]">
                    See what every rule and flow is doing, with execution
                    logs, a dashboard and link click tracking.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
