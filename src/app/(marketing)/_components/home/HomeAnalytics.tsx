"use client";

import { useEffect, useState } from "react";
import { Reveal } from "../Reveal";
import { displayFont } from "./fonts";

const POINTS = [
  "Rule analytics with execution logs and status",
  "Flow analytics with their own execution logs",
  "A dedicated dashboard for rules, flows and link performance",
  "Click tracking on every bio link, lead magnet and product",
];

function Check() {
  return (
    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--violet)] text-white">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>
    </span>
  );
}

const BARS = [
  { h: 38, delay: 0 },
  { h: 52, delay: 0.12 },
  { h: 44, delay: 0.24 },
  { h: 68, delay: 0.36 },
  { h: 60, delay: 0.48 },
  { h: 82, delay: 0.6 },
  { h: 94, delay: 0.72 },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Tone = "ok" | "mute" | "warn";
const TONES: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: "var(--success-tint)", fg: "var(--success-text)" },
  mute: { bg: "var(--neutral-tint)", fg: "var(--neutral-text)" },
  warn: { bg: "var(--warning-tint)", fg: "var(--warning-text)" },
};

const LOG_POOL: { name: string; trigger: string; status: string; tone: Tone }[] = [
  { name: "Free guide", trigger: "Comment keyword", status: "Delivered", tone: "ok" },
  { name: "Weekly tips flow", trigger: "Story reply", status: "Delivered", tone: "ok" },
  { name: "Giveaway", trigger: "Live comment", status: "Skipped: exclusion", tone: "mute" },
  { name: "Product drop", trigger: "Post share", status: "Queued", tone: "warn" },
  { name: "Checklist gate", trigger: "Comment keyword", status: "Email captured", tone: "ok" },
  { name: "Shop link", trigger: "Story reply", status: "Delivered", tone: "ok" },
  { name: "Follow-up, day 1", trigger: "Flow", status: "Sent", tone: "ok" },
  { name: "Welcome DM", trigger: "Post share", status: "Delivered", tone: "ok" },
];
const WHENS = ["just now", "1 min ago", "3 min ago", "6 min ago"];

export function HomeAnalytics() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => (t + 1) % LOG_POOL.length), 2600);
    return () => clearInterval(timer);
  }, []);

  const rows = [0, 1, 2, 3].map((i) => {
    const entry = LOG_POOL[(tick + LOG_POOL.length - i) % LOG_POOL.length];
    const tone = TONES[entry.tone];
    return { ...entry, tone, when: WHENS[i], isNew: i === 0 };
  });

  return (
    <div id="analytics" className="mx-auto flex max-w-[1920px] flex-wrap items-center gap-16 px-6 py-20 sm:px-8 sm:py-28">
      <Reveal className="flex min-w-0 flex-1 basis-[380px] flex-col items-start gap-6">
        <span className="text-sm font-bold tracking-[0.08em] text-[var(--violet)] uppercase">
          Analytics
        </span>
        <h2
          className={`${displayFont} m-0 text-4xl leading-[1.06] font-extrabold tracking-[-0.03em] sm:text-[46px]`}
        >
          Know exactly what is working
        </h2>
        <p className="m-0 text-lg text-[var(--muted)]">
          Every automation leaves a trail. Check what was sent, what was
          skipped and which links people actually tap.
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
        className="ha-lift flex min-w-0 flex-[1.3_1_480px] flex-col gap-5.5 rounded-[32px] border border-[var(--line)] bg-white p-7 shadow-[0_30px_60px_-30px_color-mix(in srgb, var(--ink) 30%, transparent)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white">
              Overview
            </span>
            <span className="rounded-full bg-[var(--neutral-tint)] px-4 py-2 text-sm font-semibold text-[var(--neutral-text)]">
              Rules
            </span>
            <span className="rounded-full bg-[var(--neutral-tint)] px-4 py-2 text-sm font-semibold text-[var(--neutral-text)]">
              Flows
            </span>
            <span className="rounded-full bg-[var(--neutral-tint)] px-4 py-2 text-sm font-semibold text-[var(--neutral-text)]">
              Link clicks
            </span>
          </div>
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[var(--success-text)]">
            <span className="ha-pdot h-2 w-2 rounded-full bg-[var(--success)]" />
            Live demo
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex h-[170px] items-end gap-2.5 border-b-[1.5px] border-[var(--line)] px-1">
            {BARS.map((bar, i) => (
              <div
                key={DAYS[i]}
                className={`ha-bar flex-1 rounded-t-lg ${
                  i === 6
                    ? "bg-[var(--accent)]"
                    : i === 5
                      ? "bg-[var(--violet)]"
                      : "bg-[#CFC6F5]"
                }`}
                style={{ height: `${bar.h}%`, animationDelay: `${bar.delay}s` }}
              />
            ))}
          </div>
          <div className="flex gap-2.5 px-1 text-center text-xs font-semibold text-[var(--muted)]">
            {DAYS.map((d) => (
              <span key={d} className="flex-1">
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="pb-2.5 text-[13px] font-bold text-[var(--muted)]">
            Execution log, sample data
          </div>
          {rows.map((row, i) => (
            <div
              key={`${row.name}-${i}`}
              className={`flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] px-2 py-3.5 ${row.isNew ? "ha-newrow" : ""}`}
            >
              <div className="min-w-0">
                <div className="text-[15px] font-semibold">{row.name}</div>
                <div className="text-[13px] text-[var(--muted)]">
                  {row.trigger} · {row.when}
                </div>
              </div>
              <span
                className="rounded-full px-3 py-1 text-[13px] font-bold"
                style={{ background: row.tone.bg, color: row.tone.fg }}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
