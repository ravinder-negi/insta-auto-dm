"use client";

import { useRef, useState } from "react";
import {
  BoltIcon,
  ChartIcon,
  ClockIcon,
  UsersIcon,
} from "@/components/icons";
import { Reveal } from "./Reveal";

const REASONS = [
  {
    icon: ClockIcon,
    tint: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    title: "Save time",
    desc: "Automate repetitive replies and focus on your business.",
  },
  {
    icon: BoltIcon,
    tint: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300",
    title: "Respond instantly",
    desc: "Never miss an opportunity with 24/7 automation.",
  },
  {
    icon: UsersIcon,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
    title: "Capture leads",
    desc: "Collect followers and email addresses easily.",
  },
  {
    icon: ChartIcon,
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
    title: "Track performance",
    desc: "See what's working and optimize for better results.",
  },
];

export function LandingWhyChoose() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slideCount = REASONS.length;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    setActive(Math.round(ratio * (slideCount - 1)));
  };

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: (index / (slideCount - 1)) * maxScroll,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="why-choose"
      className="w-full scroll-mt-8 bg-brand-50/60 px-6 py-16 sm:px-10 lg:px-25 dark:bg-zinc-900/40"
    >
      <Reveal>
        <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase dark:text-brand-400">
          Why choose Auto DM
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          A smarter way to grow on Instagram
        </h2>
      </Reveal>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4"
      >
        {REASONS.map((r, i) => (
          <Reveal
            key={r.title}
            delay={i * 100}
            className="w-[82%] shrink-0 snap-center rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:w-auto dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.tint}`}
            >
              <r.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {r.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {r.desc}
            </p>
          </Reveal>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2 sm:hidden">
        {REASONS.map((r, i) => (
          <button
            key={r.title}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              active === i
                ? "w-6 bg-brand-600 dark:bg-brand-400"
                : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
