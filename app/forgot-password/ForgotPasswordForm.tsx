"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    ForgotPasswordState,
    FormData
  >(requestPasswordReset, undefined);

  if (state && "sent" in state) {
    return (
      <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border border-black/6 bg-white/80 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:border-white/8 dark:bg-white/4">
        <h1 className="text-xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          If an account exists for that email, we&apos;ve sent a link to
          reset your password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border border-black/6 bg-white/80 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:border-white/8 dark:bg-white/4">
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight">
          Forgot password?
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="rounded-xl border border-black/10 bg-transparent px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/15 dark:focus:border-indigo-400/70"
          />
        </div>

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
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
