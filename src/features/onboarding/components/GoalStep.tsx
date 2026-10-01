"use client";

import { useActionState, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { OnboardingCard } from "./OnboardingLayout";
import { StepFooter } from "./StepFooter";
import { ONBOARDING_GOALS } from "@/features/onboarding/options";
import {
  saveGoalStep,
  type OnboardingState,
} from "@/features/onboarding/actions";

export function GoalStep({ initialGoal }: { initialGoal: string | null }) {
  const [state, formAction, pending] = useActionState<
    OnboardingState,
    FormData
  >(saveGoalStep, undefined);
  const [goal, setGoal] = useState(initialGoal ?? "");

  return (
    <OnboardingCard>
      <form action={formAction} className="flex flex-1 flex-col">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Great! What&apos;s your <span className="text-rose-500">#1 goal</span>{" "}
          right now?
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Helps us tailor your dashboard so everything you need is in one place.
          Nothing is locked — switch any time in Settings.
        </p>

        <input type="hidden" name="primary_goal" value={goal} />

        <fieldset className="mt-6">
          <legend className="sr-only">Primary goal</legend>
          <div className="flex flex-col gap-2.5">
            {ONBOARDING_GOALS.map((option) => {
              const active = goal === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setGoal(option.value)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 ${
                    active
                      ? "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/15 dark:border-brand-400/70 dark:bg-brand-500/10"
                      : "border-black/8 bg-white hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/40 dark:hover:bg-white/10"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      active
                        ? "brand-gradient border-transparent text-white"
                        : "border-black/15 text-zinc-300 dark:border-white/25 dark:text-zinc-600"
                    }`}
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {option.title}
                </button>
              );
            })}
          </div>
        </fieldset>

        {state?.error && (
          <p className="animate-fade-in-up mt-4 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <StepFooter
          backHref="/onboarding?step=content"
          canContinue={Boolean(goal)}
          pending={pending}
        />
      </form>
    </OnboardingCard>
  );
}
