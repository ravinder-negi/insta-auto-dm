"use client";

import { useActionState, useState } from "react";
import { displayFont } from "@/app/(marketing)/_components/home/fonts";
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
        <h1
          className={`${displayFont} text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl`}
        >
          Great! What&apos;s your{" "}
          <span style={{ color: "var(--accent)" }}>#1 goal</span> right now?
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
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
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium text-[var(--ink)] transition-all duration-200"
                  style={
                    active
                      ? {
                          borderColor: "var(--accent)",
                          background: "color-mix(in srgb, var(--accent) 7%, white)",
                          boxShadow: "0 0 0 2px color-mix(in srgb, var(--accent) 15%, transparent)",
                        }
                      : { borderColor: "var(--line)", background: "#fff" }
                  }
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors"
                    style={
                      active
                        ? { background: "var(--accent)", borderColor: "transparent", color: "#fff" }
                        : { borderColor: "rgba(21,19,28,.15)", color: "#C7C2D6" }
                    }
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
          <p className="animate-fade-in-up mt-4 text-sm text-red-600">{state.error}</p>
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
