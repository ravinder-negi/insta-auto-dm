"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { AuthCard } from "./AuthCard";
import { AuthTextField } from "./AuthTextField";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { ArrowLeftIcon, MailIcon } from "@/components/icons";
import { displayFont } from "@/app/(marketing)/_components/home/fonts";
import { requestPasswordReset, type ForgotPasswordState } from "@/features/auth/actions/forgot-password";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    ForgotPasswordState,
    FormData
  >(requestPasswordReset, undefined);

  if (state && "sent" in state) {
    return (
      <AuthCard>
        <AuthBrandHeader />
        <div>
          <h1
            className={`${displayFont} text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] text-[var(--ink)]`}
          >
            Check your email
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            If an account exists for that email, we&apos;ve sent a link to reset your password.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--violet)] hover:underline"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthBrandHeader />

      <div>
        <h1
          className={`${displayFont} text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] text-[var(--ink)]`}
        >
          Forgot password?
        </h1>
        <p className="mt-1.5 text-[var(--muted)]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <AuthTextField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<MailIcon className="h-5 w-5" />}
        />

        {state?.error && <p className="animate-fade-in-up text-sm text-red-600">{state.error}</p>}

        <AuthSubmitButton pending={pending} idleLabel="Send reset link" pendingLabel="Sending…" />
      </form>

      <p className="text-center text-[var(--muted)]">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-bold text-[var(--violet)] underline underline-offset-3 hover:no-underline"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
