"use client";

import { useRef, useState } from "react";
import { StarIcon } from "@/components/icons";
import { Reveal } from "./Reveal";

const TESTIMONIALS = [
  {
    name: "Aisha R.",
    role: "Fitness Coach",
    quote:
      "Comments used to pile up faster than I could reply. Now every keyword gets an instant DM and I capture leads while I sleep.",
  },
  {
    name: "Marcus D.",
    role: "Ecommerce Founder",
    quote:
      "We turned our giveaway comments into an email list in one afternoon. Setup took minutes, no developer needed.",
  },
  {
    name: "Priya N.",
    role: "Content Creator",
    quote:
      "The DMs feel personal, not automated. My audience actually replies back, and I finally have time to create.",
  },
];

export function LandingTestimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slideCount = TESTIMONIALS.length;

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
    <section className="w-full px-6 py-16 sm:px-10 lg:px-25">
      <Reveal className="mx-auto max-w-xl text-center">
        <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase dark:text-brand-400">
          Loved by creators &amp; brands
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          Built for people growing on Instagram
        </h2>
      </Reveal>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1 md:grid md:snap-none md:grid-cols-3 md:overflow-visible"
      >
        {TESTIMONIALS.map((t, i) => (
          <Reveal
            key={t.name}
            delay={i * 100}
            className="flex w-[82%] shrink-0 snap-center flex-col rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm md:w-auto dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, si) => (
                <StarIcon key={si} className="h-4 w-4" />
              ))}
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {t.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.role}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-5 flex justify-center gap-2 md:hidden">
        {TESTIMONIALS.map((t, i) => (
          <button
            key={t.name}
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
