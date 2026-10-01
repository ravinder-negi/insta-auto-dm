"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CONTENT_NICHES,
  ONBOARDING_GOALS,
} from "@/features/onboarding/options";
import {
  ONBOARDING_PATH,
  ONBOARDING_STEPS,
  pendingOnboardingStep,
  type OnboardingStatus,
  type OnboardingStep,
} from "@/lib/auth/onboarding";

export type OnboardingState = { error: string } | undefined;

const NICHE_VALUES = new Set<string>(
  CONTENT_NICHES.map((niche) => niche.value),
);
const GOAL_VALUES = new Set<string>(ONBOARDING_GOALS.map((goal) => goal.value));

/** Writes the step to both stores (see `@/lib/auth/onboarding`), never moving
 *  it backwards — revisiting step 1 from step 2 must not re-lock step 2. */
async function saveStep(
  fields: Record<string, string | null>,
  reached: OnboardingStatus,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const pending = pendingOnboardingStep(user.user_metadata);
  const step = furthest(pending, reached);

  const { error } = await supabase
    .from("profiles")
    .update({
      ...fields,
      onboarding_step: step,
      onboarding_completed_at:
        step === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { onboarding_step: step },
  });

  if (metadataError) {
    return { error: metadataError.message };
  }

  return undefined;
}

/** "done" beats any step; otherwise the later of the two step positions. */
function furthest(
  pending: OnboardingStep | null,
  reached: OnboardingStatus,
): OnboardingStatus {
  if (!pending || reached === "done") {
    return reached;
  }
  return ONBOARDING_STEPS.indexOf(pending) >
    ONBOARDING_STEPS.indexOf(reached as OnboardingStep)
    ? pending
    : reached;
}

export async function saveContentStep(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const niche = String(formData.get("content_niche") ?? "");

  if (!NICHE_VALUES.has(niche)) {
    return { error: "Pick the type of content you create." };
  }

  const state = await saveStep({ content_niche: niche }, "goal");

  if (state) {
    return state;
  }

  redirect(`${ONBOARDING_PATH}?step=goal`);
}

export async function saveGoalStep(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const goal = String(formData.get("primary_goal") ?? "");

  if (!GOAL_VALUES.has(goal)) {
    return { error: "Pick the goal that fits you best." };
  }

  const state = await saveStep({ primary_goal: goal }, "connect");

  if (state) {
    return state;
  }

  redirect(`${ONBOARDING_PATH}?step=connect`);
}

/** Finishes the flow — the connect step's skip link, its automation shortcuts
 *  and its "explore the dashboard" link all land here. */
export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const target = String(formData.get("redirectTo") ?? "");
  const destination =
    target.startsWith("/") && !target.startsWith("//") ? target : "/dashboard";

  const state = await saveStep({}, "done");

  if (state) {
    return state;
  }

  redirect(destination);
}
