"use client";

import { useActionState, useState } from "react";
import { SparkleIcon } from "@/components/icons";
import { OnboardingCard } from "./OnboardingLayout";
import { StepFooter } from "./StepFooter";
import { CONTENT_NICHES } from "@/features/onboarding/options";
import {
  saveContentStep,
  type OnboardingState,
} from "@/features/onboarding/actions";

export function ContentStep({
  firstName,
  initialNiche,
}: {
  firstName: string;
  initialNiche: string | null;
}) {
  const [state, formAction, pending] = useActionState<
    OnboardingState,
    FormData
  >(saveContentStep, undefined);
  const [niche, setNiche] = useState(initialNiche ?? "");
  const selected = CONTENT_NICHES.find((option) => option.value === niche);

  return (
    <OnboardingCard>
      <form action={formAction} className="flex flex-1 flex-col">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          👋 Hi {firstName}, what type of{" "}
          <span className="brand-text-gradient">content</span> do you create?
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          This helps us share relevant tools, inspiration, and examples from
          other creators in your niche.
        </p>

        <input type="hidden" name="content_niche" value={niche} />

        <fieldset className="mt-6">
          <legend className="sr-only">Content niche</legend>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {CONTENT_NICHES.map((option) => {
              const active = niche === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setNiche(option.value)}
                  className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm font-medium transition-all duration-200 ${
                    active
                      ? "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/15 dark:border-brand-400/70 dark:bg-brand-500/10"
                      : "border-black/8 bg-white hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/40 dark:hover:bg-white/10"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm dark:bg-zinc-800"
                  >
                    {option.emoji}
                  </span>
                  <span className="min-w-0 truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {selected && (
          <p className="animate-fade-in-up mt-5 flex items-center gap-2 text-sm text-brand-600 dark:text-brand-300">
            <SparkleIcon className="h-4 w-4 shrink-0" />
            Nice — your first automation will start from our {
              selected.label
            }{" "}
            templates.
          </p>
        )}

        {state?.error && (
          <p className="animate-fade-in-up mt-4 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <StepFooter canContinue={Boolean(niche)} pending={pending} />
      </form>
    </OnboardingCard>
  );
}
