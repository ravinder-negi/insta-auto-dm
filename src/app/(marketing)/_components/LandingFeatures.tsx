"use client";

import { useRef, useState } from "react";
import {
  ChatIcon,
  MailIcon,
  SendIcon,
  UsersIcon,
} from "@/components/icons";
import { Reveal } from "./Reveal";

const SLIDE_COUNT = 3;

export function LandingFeatures() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    setActive(Math.round(ratio * (SLIDE_COUNT - 1)));
  };

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: (index / (SLIDE_COUNT - 1)) * maxScroll,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="features"
      className="w-full scroll-mt-8 px-6 py-16 sm:px-10 lg:px-25"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase dark:text-brand-400">
            Powerful features
          </span>
          <h2 className="mt-2 max-w-lg text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Everything you need to automate Instagram{" "}
            <span className="brand-text-gradient">conversations</span>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Simple yet powerful tools to help you engage, capture leads and
          grow your business on Instagram.
        </p>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1 md:grid md:snap-none md:grid-cols-3 md:overflow-visible"
      >
        <Reveal className="w-[82%] shrink-0 snap-center rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm md:w-auto dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            <ChatIcon className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Comment triggers
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Automatically respond when someone comments a keyword on your
            posts or reels.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <ChatIcon className="h-4 w-4" />
            </div>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
              GUIDE
            </span>
          </div>
        </Reveal>

        <Reveal
          delay={100}
          className="w-[82%] shrink-0 snap-center rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm md:w-auto dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            <SendIcon className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Personalized DMs
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Send tailored messages, links, images or offers to each user
            automatically.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              Here&rsquo;s your guide! 📘
            </span>
            <div className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white">
              <SendIcon className="h-4 w-4" />
            </div>
          </div>
        </Reveal>

        <Reveal
          delay={200}
          className="w-[82%] shrink-0 snap-center rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm md:w-auto dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            <UsersIcon className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Follow &amp; Email capture
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Ask users to follow your page, collect email addresses and build
            your audience.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <UsersIcon className="h-4 w-4" />
            </div>
            <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <MailIcon className="h-4 w-4" />
            </div>
            <span className="brand-gradient ml-auto rounded-full px-3 py-1.5 text-xs font-semibold text-white">
              Follow
            </span>
          </div>
        </Reveal>
      </div>

      <div className="mt-5 flex justify-center gap-2 md:hidden">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
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
