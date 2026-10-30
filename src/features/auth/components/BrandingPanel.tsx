"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BoltIcon, ChatIcon, SendIcon, TrendingIcon, UsersIcon } from "@/components/icons";
import { displayFont } from "@/app/(marketing)/_components/home/fonts";

const FEATURES = [
  { icon: BoltIcon, title: "Auto replies", desc: "Respond instantly", delay: "ha-d3" },
  { icon: UsersIcon, title: "More engagement", desc: "Build real connections", delay: "ha-d4" },
  { icon: TrendingIcon, title: "Grow faster", desc: "Turn comments into customers", delay: "ha-d4" },
];

const MESSAGES = [
  "Automate Today. Grow Tomorrow.",
  "Reply to every comment, day and night.",
  "Capture leads while you sleep.",
];

export function BrandingPanel() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % MESSAGES.length), 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative flex flex-1 flex-col justify-between gap-10 overflow-hidden bg-[var(--ink)] p-12 text-white"
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1.2px, transparent 1.2px)",
        backgroundSize: "30px 30px",
      }}
    >
      <div className="ha-blob1 pointer-events-none absolute -top-30 -left-30 h-115 w-115 rounded-full bg-[var(--accent)] opacity-35 blur-[120px]" />
      <div className="ha-blob2 pointer-events-none absolute -right-30 -bottom-40 h-130 w-130 rounded-full bg-[var(--violet)] opacity-50 blur-[120px]" />

      <Link href="/" className="ha-fadeup relative flex w-fit items-center gap-3.5 transition-opacity hover:opacity-80">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-[var(--accent)] text-white">
          <BoltIcon className="h-6 w-6" />
        </span>
        <span className="leading-tight">
          <span className={`${displayFont} block text-[22px] font-extrabold tracking-[-0.02em]`}>
            Auto DM
          </span>
          <span className="block text-[13px] text-white/65">Engage. Automate. Grow.</span>
        </span>
      </Link>

      <div className="relative flex flex-wrap items-center gap-8">
        <div className="flex min-w-0 flex-1 basis-75 flex-col items-start gap-6.5">
          <div className="ha-fadeup ha-d1 inline-flex items-center gap-2.5 rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold tracking-[0.1em] text-[#E4DEF7] uppercase">
            <span className="ha-pdot h-2 w-2 rounded-full bg-[var(--secondary)]" />
            <span>Instagram automation</span>
          </div>

          <h1
            className={`${displayFont} ha-fadeup ha-d2 m-0 text-[clamp(2.5rem,4.4vw,3.75rem)] leading-[1.04] font-extrabold tracking-[-0.035em]`}
          >
            Turn conversations into <span className="text-[var(--secondary)]">customers.</span>
          </h1>

          <p className="ha-fadeup ha-d3 m-0 max-w-105 text-lg text-white/65">
            Automate Instagram comments and DMs, engage your audience, and never miss an
            opportunity.
          </p>

          <div className="mt-1.5 flex flex-col gap-4.5">
            {FEATURES.map((f) => (
              <div key={f.title} className={`ha-fadeup ${f.delay} group flex items-center gap-3.5`}>
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/15 bg-white/7 text-[#D9D0FF] transition-colors duration-300 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white">
                  <f.icon className="h-5.5 w-5.5" />
                </span>
                <span>
                  <span className="block text-[17px] font-semibold">{f.title}</span>
                  <span className="block text-sm text-white/65">{f.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div aria-hidden="true" className="relative hidden min-h-105 flex-1 basis-70 sm:block">
          <div className="ha-float1 absolute top-0 left-24">
            <div className="ha-pulsering flex h-18 w-18 items-center justify-center rounded-[22px] bg-[var(--accent)] text-white">
              <ChatIcon className="h-8.5 w-8.5" />
            </div>
          </div>

          <svg className="absolute top-19 left-32" width="20" height="60" viewBox="0 0 20 60">
            <path
              className="animate-dash-flow"
              d="M10 2 C 14 20, 4 38, 10 58"
              fill="none"
              stroke="#9C8FD6"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <div className="au-cardloop absolute top-35 left-15">
            <div className="ha-float2 flex items-center gap-2.5 rounded-2xl bg-white px-4.5 py-3 text-[var(--ink)] shadow-[0_20px_40px_-16px_rgba(0,0,0,.6)]">
              <ChatIcon className="h-4.5 w-4.5 text-[var(--violet)]" />
              <span className="leading-tight">
                <span className="block text-[13px] font-semibold">New comment</span>
                <span className="block text-[13px] text-[var(--muted)]">&ldquo;GUIDE&rdquo;</span>
              </span>
            </div>
          </div>

          <div className="au-pillloop absolute top-62.5 left-6">
            <div className="ha-float3 inline-flex items-center gap-2.5 rounded-full bg-[var(--accent)] px-5.5 py-3 text-[15px] font-semibold text-white shadow-[0_18px_40px_-10px_color-mix(in srgb, var(--primary) 65%, transparent)]">
              <BoltIcon className="h-4 w-4" />
              <span>Auto DM sent</span>
            </div>
          </div>

          <svg className="au-lineloop absolute top-74 left-30" width="180" height="120" viewBox="0 0 180 120">
            <path
              className="animate-dash-flow"
              d="M4 4 C 40 40, 90 40, 150 96"
              fill="none"
              stroke="#9C8FD6"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <div className="au-planeloop absolute top-87.5 left-37.5">
            <SendIcon className="h-10 w-10 text-[var(--secondary-border)]" />
          </div>
        </div>
      </div>

      <div className="relative flex min-h-7 items-center gap-4">
        <div className="flex items-center gap-2">
          {MESSAGES.map((_, i) => (
            <span
              key={i}
              className="h-2 rounded-full transition-all duration-400"
              style={{
                width: i === slide ? 28 : 8,
                background: i === slide ? "#fff" : "rgba(255,255,255,.35)",
              }}
            />
          ))}
        </div>
        <span key={slide} className="ha-pop text-sm text-white/65">
          {MESSAGES[slide]}
        </span>
      </div>
    </div>
  );
}
