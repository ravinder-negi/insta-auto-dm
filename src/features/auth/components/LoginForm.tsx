"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordField } from "./PasswordField";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { AuthCard } from "./AuthCard";
import { AuthTextField } from "./AuthTextField";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { AuthDivider } from "./AuthDivider";
import { MailIcon } from "@/components/icons";
import { displayFont } from "@/app/(marketing)/_components/home/fonts";
import { signIn, type AuthState } from "@/features/auth/actions/login";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    undefined
  );

  return (
    <AuthCard>
      <AuthBrandHeader />

      <div>
        <h1
          className={`${displayFont} text-[38px] leading-[1.05] font-extrabold tracking-[-0.03em] text-[var(--ink)]`}
        >
          Welcome back
        </h1>
        <p className="mt-1.5 text-[var(--muted)]">Sign in to continue to your account</p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <AuthTextField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<MailIcon className="h-5 w-5" />}
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          minLength={6}
          labelAction={
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-[var(--violet)] hover:underline"
            >
              Forgot password?
            </Link>
          }
        />

        {state?.error && <p className="animate-fade-in-up text-sm text-red-600">{state.error}</p>}

        <AuthSubmitButton pending={pending} idleLabel="Sign in" pendingLabel="Signing in…" />
      </form>

      <AuthDivider />

      <p className="text-center text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-bold text-[var(--violet)] underline underline-offset-3 hover:no-underline"
        >
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
