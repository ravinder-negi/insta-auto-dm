"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthBrandHeader } from "@/app/AuthBrandHeader";
import { AuthCard } from "@/app/AuthCard";
import { PasswordField } from "@/app/components/PasswordField";
import { ArrowRightIcon } from "@/app/dashboard/components/icons";
import { updatePassword, type ResetPasswordState } from "./actions";

export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const [state, formAction, pending] = useActionState<
    ResetPasswordState,
    FormData
  >(updatePassword, undefined);

  if (!hasSession) {
    return (
      <AuthCard>
        <AuthBrandHeader />
        <h1 className="text-3xl font-bold tracking-tight">Link expired</h1>
        <p className="mt-2 text-sm text-zinc-500">
          This password reset link is invalid or has expired. Request a new
          one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Request new link →
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthBrandHeader />

      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">
          Set a new password
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Choose a new password for your account.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
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

        {state?.error && (
          <p className="animate-fade-in-up text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="brand-gradient mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
        >
          {pending ? "Updating…" : "Update password"}
          {!pending && <ArrowRightIcon className="h-4 w-4" />}
        </button>
      </form>
    </AuthCard>
  );
}
