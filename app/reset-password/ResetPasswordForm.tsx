"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordField } from "@/app/components/PasswordField";
import { updatePassword, type ResetPasswordState } from "./actions";

export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const [state, formAction, pending] = useActionState<
    ResetPasswordState,
    FormData
  >(updatePassword, undefined);

  if (!hasSession) {
    return (
      <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border border-black/6 bg-white/80 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:border-white/8 dark:bg-white/4">
        <h1 className="text-xl font-semibold tracking-tight">
          Link expired
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          This password reset link is invalid or has expired. Request a new
          one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Request new link →
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border border-black/6 bg-white/80 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:border-white/8 dark:bg-white/4">
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight">
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
          className="mt-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
