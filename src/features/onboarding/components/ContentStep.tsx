"use client";

import { useActionState, useState } from "react";
import { displayFont } from "@/app/(marketing)/_components/home/fonts";
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
        <h1
          className={`${displayFont} text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl`}
        >
          👋 Hi {firstName}, what type of{" "}
          <span style={{ color: "var(--accent)" }}>content</span> do you create?
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
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
                  className="flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm font-medium transition-all duration-200"
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg)] text-lg shadow-sm"
                  >
                    {option.emoji}
                  </span>
                  <span className="min-w-0 truncate text-[var(--ink)]">{option.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {selected && (
          <p
            className="animate-fade-in-up mt-5 flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            <SparkleIcon className="h-4 w-4 shrink-0" />
            Nice — your first automation will start from our {
              selected.label
            }{" "}
            templates.
          </p>
        )}

        {state?.error && (
          <p className="animate-fade-in-up mt-4 text-sm text-red-600">{state.error}</p>
        )}

        <StepFooter canContinue={Boolean(niche)} pending={pending} />
      </form>
    </OnboardingCard>
  );
}
