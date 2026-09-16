"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordField } from "@/app/components/PasswordField";
import { signUp, type AuthState } from "../login/actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    undefined
  );

  return (
    <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border border-black/6 bg-white/80 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:border-white/8 dark:bg-white/4">
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Sign up to get started with Auto DM
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

        <PasswordField
          id="password"
          name="password"
          label="Password"
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
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
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
