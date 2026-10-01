/** Post-signup onboarding: which step a user still owes, and how to read it.
 *
 *  The step is stored twice on purpose:
 *  - `auth.users.raw_user_meta_data.onboarding_step` — the gate. `proxy.ts`
 *    reads it straight off the session user, so gating costs no extra query.
 *  - `profiles.onboarding_step` — the durable copy next to the answers.
 *
 *  Both are written together in src/features/onboarding/actions.ts. Users that
 *  predate onboarding have neither and are treated as done. */

export const ONBOARDING_STEPS = ["content", "goal", "connect"] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Stored value: a pending step, or "done" once the flow is finished/skipped. */
export type OnboardingStatus = OnboardingStep | "done";

export const ONBOARDING_PATH = "/onboarding";

/** Where signup starts every new user. */
export const FIRST_ONBOARDING_STEP: OnboardingStep = "content";

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return ONBOARDING_STEPS.includes(value as OnboardingStep);
}

/** The step still owed, or null when nothing is owed (finished, or a legacy
 *  account that never had the flow). */
export function pendingOnboardingStep(
  metadata: Record<string, unknown> | undefined | null
): OnboardingStep | null {
  const step = metadata?.onboarding_step;
  return isOnboardingStep(step) ? step : null;
}

/** Steps the user is allowed to view: everything up to and including the
 *  pending one. Going back is fine, jumping ahead is not. */
export function isStepReachable(
  step: OnboardingStep,
  pending: OnboardingStep
): boolean {
  return ONBOARDING_STEPS.indexOf(step) <= ONBOARDING_STEPS.indexOf(pending);
}
