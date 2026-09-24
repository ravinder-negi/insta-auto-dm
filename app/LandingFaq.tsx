"use client";

import { useState } from "react";
import { ChevronDownIcon } from "./dashboard/components/icons";
import { Reveal } from "./components/Reveal";

const FAQS = [
  {
    q: "How does Auto DM work?",
    a: "Connect your Instagram account, then create a rule that pairs a keyword with a DM. When someone comments that keyword on your posts or reels, Auto DM instantly sends them the matching reply.",
  },
  {
    q: "Is my Instagram account safe?",
    a: "Yes. Auto DM connects through Instagram's official API using secure, revocable access tokens, and never asks for your password.",
  },
  {
    q: "Can I send images or links in DMs?",
    a: "Yes. Your automated replies can include text, links, and images so you can share guides, offers, or resources directly in the conversation.",
  },
  {
    q: "Do I need a credit card to get started?",
    a: "No. You can create an account and set up your first automation rule in minutes without entering any billing details.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="w-full px-6 py-16 sm:px-10 lg:px-25">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-14">
        <Reveal>
          <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase dark:text-brand-400">
            FAQ
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Everything you need to know about Auto DM.
          </p>
        </Reveal>

        <Reveal
          delay={150}
          className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
        >
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-zinc-900 dark:text-zinc-50"
                >
                  {faq.q}
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {open && (
                  <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
