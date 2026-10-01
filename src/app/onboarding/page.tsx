import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConnectStep } from "@/features/onboarding/components/ConnectStep";
import { ContentStep } from "@/features/onboarding/components/ContentStep";
import { GoalStep } from "@/features/onboarding/components/GoalStep";
import { OnboardingLayout } from "@/features/onboarding/components/OnboardingLayout";
import {
  ONBOARDING_STEPS,
  isOnboardingStep,
  isStepReachable,
  pendingOnboardingStep,
} from "@/lib/auth/onboarding";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/onboarding");
  }

  // The server decides which step is owed; `?step=` can only walk back to one
  // already reached, never jump ahead of it.
  const pending = pendingOnboardingStep(user.user_metadata);

  if (!pending) {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const requested = firstParam(searchParams.step);
  const step =
    isOnboardingStep(requested) && isStepReachable(requested, pending)
      ? requested
      : pending;
  const position = ONBOARDING_STEPS.indexOf(step) + 1;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, content_niche, primary_goal")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ??
    (user.user_metadata.display_name as string | undefined) ??
    "";
  const firstName = displayName.trim().split(/\s+/)[0] || "there";

  if (step === "content") {
    return (
      <OnboardingLayout step={position}>
        <ContentStep
          firstName={firstName}
          initialNiche={profile?.content_niche ?? null}
        />
      </OnboardingLayout>
    );
  }

  if (step === "goal") {
    return (
      <OnboardingLayout step={position} backHref="/onboarding?step=content">
        <GoalStep initialGoal={profile?.primary_goal ?? null} />
      </OnboardingLayout>
    );
  }

  const { count } = await supabase
    .from("instagram_accounts")
    .select("id", { count: "exact", head: true });

  return (
    <OnboardingLayout step={position} backHref="/onboarding?step=goal">
      <ConnectStep
        firstName={firstName}
        connected={(count ?? 0) > 0}
        connectError={firstParam(searchParams.error)}
      />
    </OnboardingLayout>
  );
}
