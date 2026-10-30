"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { AuthCard } from "./AuthCard";
import { AuthSubmitButton } from "./AuthSubmitButton";
import { PasswordField } from "./PasswordField";
import { ArrowRightIcon } from "@/components/icons";
import { displayFont } from "@/app/(marketing)/_components/home/fonts";
import { updatePassword, type ResetPasswordState } from "@/features/auth/actions/reset-password";

export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const [state, formAction, pending] = useActionState<
    ResetPasswordState,
    FormData
  >(updatePassword, undefined);

  if (!hasSession) {
    return (
      <AuthCard>
        <AuthBrandHeader />
        <div>
          <h1
            className={`${displayFont} text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] text-[var(--ink)]`}
          >
            Link expired
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            This password reset link is invalid or has expired. Request a new one to continue.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--violet)] hover:underline"
        >
          Request new link
          <ArrowRightIcon className="h-4 w-4" />
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
          Set a new password
        </h1>
        <p className="mt-1.5 text-[var(--muted)]">Choose a new password for your account.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <PasswordField
          id="password"
          name="password"
          label="New password"
          autoComplete="new-password"
          minLength={6}
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          minLength={6}
        />

        {state?.error && <p className="animate-fade-in-up text-sm text-red-600">{state.error}</p>}

        <AuthSubmitButton pending={pending} idleLabel="Update password" pendingLabel="Updating…" />
      </form>
    </AuthCard>
  );
}
