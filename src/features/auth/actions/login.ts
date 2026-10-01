"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  FIRST_ONBOARDING_STEP,
  ONBOARDING_PATH,
} from "@/lib/auth/onboarding";

export type AuthState = { error: string } | undefined;

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo || "/dashboard");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // onboarding_step is the gate proxy.ts reads; the profiles trigger copies
    // it into the new profile row. See @/lib/auth/onboarding.
    options: {
      data: { display_name: name, onboarding_step: FIRST_ONBOARDING_STEP },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      error: "Check your inbox to confirm your email before signing in.",
    };
  }

  redirect(ONBOARDING_PATH);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
