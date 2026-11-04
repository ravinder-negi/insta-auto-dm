"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/redirect";
import {
  FIRST_ONBOARDING_STEP,
  ONBOARDING_PATH,
} from "@/lib/auth/onboarding";

export type AuthState = { error: string } | undefined;

/** Sign-up can also end in "confirm your email" — a success, not an error. */
export type SignUpState = { error: string } | { confirmEmail: string } | undefined;

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  // Re-checked here: the hidden field is just form data a crafted page
  // could fill with another site.
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

export async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // onboarding_step is the gate proxy.ts reads; the profiles trigger copies
    // it into the new profile row. See @/lib/auth/onboarding.
    options: {
      data: { display_name: name, onboarding_step: FIRST_ONBOARDING_STEP },
      emailRedirectTo: `${origin}/auth/callback?redirectTo=${ONBOARDING_PATH}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Email confirmation is on: the account exists, the user just has to click
  // the link we sent.
  if (!data.session) {
    return { confirmEmail: email };
  }

  redirect(ONBOARDING_PATH);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
