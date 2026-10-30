"use client";

import { useEffect, useState } from "react";
import { displayFont } from "./fonts";

const CHECKS = ["Secure Instagram OAuth", "Multiple accounts", "No code needed"];
const WORDS = ["conversations", "leads", "customers", "sales"];

function Underline() {
  return (
    <svg
      style={{ position: "absolute", left: 0, bottom: -4, width: "100%", height: 14 }}
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
  );
}

function TypingDots() {
  return (
    <div className="ha-pop inline-flex flex-none items-center gap-1.5 self-start rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[6px] bg-[var(--neutral-tint)] px-4 py-3.5">
      <span className="ha-dotb" />
      <span className="ha-dotb" />
      <span className="ha-dotb" />
    </div>
  );
}

export function HomeHero() {
  const [step, setStep] = useState(0);
  const [word, setWord] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => setStep((s) => (s + 1) % 15), 1000);
    const wordTimer = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2800);
    return () => {
      clearInterval(stepTimer);
      clearInterval(wordTimer);
    };
  }, []);

  const h = {
    matched: step >= 1,
    typing1: step === 2,
    bot1: step >= 3,
    btn: step >= 4,
    bot2: step >= 5,
    chips: step >= 6,
    user: step >= 7,
    typing2: step === 8,
    bot3: step >= 9,
    leadChip: step >= 10,
    followChip: step >= 11,
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundImage: "radial-gradient(#DDD6EC 1.2px, transparent 1.2px)", backgroundSize: "30px 30px" }}
    >
      <div className="ha-blob1 pointer-events-none absolute -top-30 -left-35 h-130 w-130 rounded-full bg-[var(--tint)] opacity-75 blur-[90px]" />
      <div className="ha-blob2 pointer-events-none absolute top-35 -right-40 h-140 w-140 rounded-full bg-[var(--secondary-pale-border)] opacity-80 blur-[100px]" />

      <div
        id="top"
        className="relative mx-auto flex max-w-[1920px] flex-wrap items-center gap-14 px-6 pt-10 pb-20 sm:px-8 sm:pb-26"
      >
        <div className="flex min-w-0 flex-1 basis-[480px] flex-col items-start gap-7">
          <div className="ha-fadeup inline-flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-white py-2 pr-4 pl-3 text-sm font-semibold text-[var(--muted)]">
            <span className="ha-pdot h-2 w-2 rounded-full bg-[var(--success)]" />
            <span>Instagram DM automation</span>
          </div>

          <h1
            className={`${displayFont} ha-fadeup ha-d1 m-0 text-5xl leading-[1.02] font-extrabold tracking-[-0.03em] sm:text-6xl lg:text-[72px] lg:tracking-[-0.035em]`}
          >
            Turn Instagram engagement into
            <span className="relative block min-h-[1.15em] text-[var(--accent)]">
              <span key={word} className="ha-pop relative inline-block">
                {WORDS[word]}
                <Underline />
              </span>
            </span>
          </h1>

          <p className="ha-fadeup ha-d2 m-0 max-w-[540px] text-lg leading-[1.55] text-[var(--muted)] sm:text-xl">
            Reply to every comment, story reply, live comment and post share
            with an instant DM. Capture leads, deliver your content and track
            what works, all on autopilot.
          </p>

          <div className="ha-fadeup ha-d3 flex flex-wrap gap-3.5">
            <a
              href="#cta"
              className="ha-btn inline-flex min-h-14 items-center gap-2.5 rounded-full bg-[var(--accent)] px-7 text-[17px] font-semibold text-white"
            >
              <span>Connect your Instagram</span>
              <span className="ha-arr">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
              </span>
            </a>
            <a
              href="#how"
              className="ha-btn inline-flex min-h-14 items-center rounded-full border-[1.5px] border-[var(--ink)] bg-white px-7 text-[17px] font-semibold"
            >
              See how it works
            </a>
          </div>

          <div className="ha-fadeup ha-d4 flex flex-wrap gap-x-6 gap-y-2.5 text-[15px] font-medium text-[var(--muted)]">
            {CHECKS.map((label) => (
              <span key={label} className="inline-flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="ha-fadeup ha-d2 relative flex min-h-[600px] min-w-0 flex-1 basis-[400px] items-center justify-center rounded-[44px] border border-[#E1D9FB] bg-[var(--tint2)]/75 sm:min-h-[740px]">
          <div className="ha-spinner pointer-events-none absolute h-[480px] w-[480px] rounded-full border-2 border-dashed border-[var(--secondary-border)]" />

          <div className="ha-float1 absolute top-7 left-5 z-2 flex items-center gap-2.5 rounded-2xl bg-white py-2.5 pr-4 pl-3 text-sm font-semibold shadow-[0_12px_30px_-12px_color-mix(in srgb, var(--ink) 28%, transparent)]">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[var(--tint2)] text-[var(--violet)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"></path></svg>
            </span>
            <span>Trigger: comment keyword</span>
          </div>

          {h.leadChip && (
            <div className="ha-pop absolute right-5 bottom-7 z-2">
              <div className="ha-float2 flex items-center gap-2.5 rounded-2xl bg-white py-2.5 pr-4 pl-3 text-sm font-semibold shadow-[0_12px_30px_-12px_color-mix(in srgb, var(--ink) 28%, transparent)]">
                <span className="ha-pulsegreen flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[var(--success-tint)] text-[var(--success-text)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path></svg>
                </span>
                <span>Lead captured</span>
              </div>
            </div>
          )}
          {h.followChip && (
            <div className="ha-pop absolute bottom-23 left-5 z-2">
              <div className="ha-float3 flex items-center gap-2.5 rounded-2xl bg-white py-2.5 pr-4 pl-3 text-sm font-semibold shadow-[0_12px_30px_-12px_color-mix(in srgb, var(--ink) 28%, transparent)]">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[var(--warning-tint)] text-[var(--warning-text)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>
                </span>
                <span>Follow-up in 1 day</span>
              </div>
            </div>
          )}

          <div className="relative flex h-[640px] w-[300px] flex-col gap-3 overflow-hidden rounded-[42px] border-[8px] border-[var(--ink)] bg-white px-3.5 py-5 shadow-[0_40px_70px_-24px_color-mix(in srgb, var(--ink) 50%, transparent)]">
            <div className="flex flex-none items-start gap-2.5 rounded-2xl border border-[var(--line)] p-3">
              <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[#E8E2FF] text-[13px] font-bold text-[var(--violet)]">
                M
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="text-[13px] leading-[1.3]">
                  <strong>maya.codes</strong>{" "}
                  <span className="text-[var(--muted)]">on your reel</span>
                </div>
                <div className="text-[15px] leading-[1.35]">Send me the guide!</div>
                {h.matched && (
                  <div className="ha-pop inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--success-tint)] px-2.5 py-0.5 text-xs font-semibold text-[var(--success-text)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>
                    <span>Keyword matched: guide</span>
                  </div>
                )}
              </div>
            </div>

            {h.typing1 && <TypingDots />}
            {h.bot1 && (
              <div className="ha-pop flex flex-none flex-col gap-2.5">
                <div className="text-center text-xs font-medium text-[var(--muted)]">
                  Auto-DM sent
                </div>
                <div className="max-w-[86%] self-start rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[6px] bg-[var(--neutral-tint)] px-3.5 py-2.5 text-sm leading-[1.4]">
                  Hey Maya! Thanks for commenting. Here is your free guide.
                </div>
              </div>
            )}
            {h.btn && (
              <a
                href="#"
                className="ha-pop ha-pulsering inline-flex min-h-11 flex-none items-center gap-2 self-start rounded-xl border-[1.5px] border-[var(--accent)] bg-white px-4.5 text-sm font-bold text-[var(--accent)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path></svg>
                <span>Get the free guide</span>
              </a>
            )}
            {h.bot2 && (
              <div className="ha-pop max-w-[86%] flex-none self-start rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[6px] bg-[var(--neutral-tint)] px-3.5 py-2.5 text-sm leading-[1.4]">
                Want weekly tips too?
              </div>
            )}
            {h.chips && (
              <div className="ha-pop flex flex-none gap-2">
                <span className="rounded-full border-[1.5px] border-[var(--violet)] px-4 py-1.5 text-[13px] font-bold text-[var(--violet)]">
                  Yes
                </span>
                <span className="rounded-full border-[1.5px] border-[var(--line)] px-4 py-1.5 text-[13px] font-semibold text-[var(--muted)]">
                  Not now
                </span>
              </div>
            )}
            {h.user && (
              <div className="ha-pop flex-none self-end rounded-tl-[18px] rounded-tr-[18px] rounded-br-[6px] rounded-bl-[18px] bg-[var(--violet)] px-4 py-2.5 text-sm font-semibold text-white">
                Yes
              </div>
            )}
            {h.typing2 && <TypingDots />}
            {h.bot3 && (
              <div className="ha-pop max-w-[86%] flex-none self-start rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[6px] bg-[var(--neutral-tint)] px-3.5 py-2.5 text-sm leading-[1.4]">
                You are in! Your first tip lands tomorrow.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
