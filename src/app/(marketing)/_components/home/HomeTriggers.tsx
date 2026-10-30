"use client";

import { useEffect, useState } from "react";
import { Reveal } from "../Reveal";
import { displayFont } from "./fonts";

const TABS = [
  {
    bg: "bg-[var(--accent)]",
    title: "Comment keyword",
    subtitle: "Match a list or any comment",
    icon: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
    demo: {
      label: "New comment",
      from: "sam.fit",
      message: "guide please",
      matched: "Keyword matched",
      reply: "Hey Sam! Here is the guide you asked for.",
      cta: "Get the guide",
    },
  },
  {
    bg: "bg-[var(--violet)]",
    title: "Story reply",
    subtitle: "Answer every story reply",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" strokeDasharray="3.5 3" />
        <path d="M9 12h6M12 9v6" />
      </>
    ),
    demo: {
      label: "Story reply",
      from: "priya.d",
      message: "Where can I get this?",
      matched: "Rule matched",
      reply: "Hi Priya! Here is the link to shop it.",
      cta: "Shop now",
    },
  },
  {
    bg: "bg-[var(--accent)]",
    title: "Live comment",
    subtitle: "Reply while you are live",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4" />
      </>
    ),
    demo: {
      label: "Live now",
      from: "alex.t",
      message: "link?",
      matched: "Keyword matched",
      reply: "Thanks for joining the live, Alex! Here is the link.",
      cta: "Open link",
      live: true,
    },
  },
  {
    bg: "bg-[var(--violet)]",
    title: "Post share",
    subtitle: "Thank people who share",
    icon: (
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 15V3M7.5 7.5L12 3l4.5 4.5" />
    ),
    demo: {
      label: "Post shared",
      from: "jordan.k",
      message: "shared your post",
      matched: "Rule matched",
      reply: "Thanks for sharing, Jordan! Want the free checklist?",
      chips: ["Yes", "Not now"],
    },
  },
];

export function HomeTriggers() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((i) => (i + 1) % TABS.length), 5200);
    return () => clearInterval(timer);
  }, []);

  const demo = TABS[active].demo;

  return (
    <div className="border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-11 px-6 py-20 sm:px-8 sm:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2
            className={`${displayFont} m-0 max-w-[600px] text-3xl leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[48px] sm:leading-[1.06]`}
          >
            Four ways to start a conversation
          </h2>
          <p className="m-0 max-w-[420px] text-[var(--muted)]">
            Pick the moment your audience engages. Tap a trigger to see what
            AutoDM does.
          </p>
        </Reveal>

        <Reveal className="flex flex-wrap items-stretch gap-7">
          <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-3.5">
            {TABS.map((tab, i) => {
              const isActive = i === active;
              return (
                <button
                  key={tab.title}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`ha-tabbtn flex min-h-21 w-full items-center gap-4 rounded-[22px] border-[1.5px] px-5 py-4 text-left text-[var(--ink)] ${
                    isActive
                      ? "border-[var(--accent)] bg-white shadow-[0_18px_40px_-18px_color-mix(in srgb, var(--ink) 35%, transparent)]"
                      : "border-[var(--line)] bg-[var(--bg)]"
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl text-white ${tab.bg}`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      {tab.icon}
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={`${displayFont} text-xl font-bold`}>
                      {tab.title}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      {tab.subtitle}
                    </span>
                  </span>
                  <span className={isActive ? "opacity-100" : "opacity-25"}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex min-h-[440px] min-w-0 flex-[1.5_1_440px] flex-col justify-center rounded-[32px] border border-[#E1D9FB] bg-[var(--secondary-soft-bg)] p-8">
            <div key={active} className="ha-pop flex flex-col items-stretch gap-0">
              <div className="flex flex-col gap-2 rounded-[20px] border border-[var(--line)] bg-white p-4.5">
                {demo.live ? (
                  <div className="flex items-center gap-2 text-xs font-bold tracking-[0.06em] text-[var(--danger-deep)] uppercase">
                    <span className="ha-pdot h-2 w-2 rounded-full bg-[var(--danger)]" />
                    {demo.label}
                  </div>
                ) : (
                  <div className="text-xs font-bold tracking-[0.06em] text-[var(--muted)] uppercase">
                    {demo.label}
                  </div>
                )}
                <div className="text-base">
                  <strong>{demo.from}</strong> {demo.message}
                </div>
                <div className="self-start rounded-full bg-[var(--success-tint)] px-2.5 py-0.5 text-xs font-bold text-[var(--success-text)]">
                  {demo.matched}
                </div>
              </div>
              <div className="relative h-10 w-0.5 self-center bg-[#BFB5E8]">
                <span className="ha-tdot" />
              </div>
              <div className="flex flex-col gap-3 rounded-[20px] bg-[var(--violet)] p-4.5 text-white">
                <div className="text-xs font-bold tracking-[0.06em] opacity-80 uppercase">
                  Auto-DM
                </div>
                <div className="text-base">{demo.reply}</div>
                {demo.cta && (
                  <div className="inline-flex min-h-10 w-fit items-center rounded-xl bg-white px-4 text-sm font-bold text-[var(--violet)]">
                    {demo.cta}
                  </div>
                )}
                {demo.chips && (
                  <div className="flex gap-2">
                    <span className="rounded-full bg-white px-4.5 py-2 text-sm font-bold text-[var(--violet)]">
                      {demo.chips[0]}
                    </span>
                    <span className="rounded-full border-[1.5px] border-white px-4.5 py-2 text-sm font-semibold">
                      {demo.chips[1]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
