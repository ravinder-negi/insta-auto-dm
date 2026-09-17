"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordField } from "@/app/components/PasswordField";
import { AuthBrandHeader } from "@/app/AuthBrandHeader";
import { AuthCard } from "@/app/AuthCard";
import { ArrowRightIcon, MailIcon } from "@/app/dashboard/components/icons";
import { signIn, type AuthState } from "./actions";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    undefined
  );

  return (
    <AuthCard>
      <AuthBrandHeader />

      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Sign in to continue to your account
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <MailIcon className="pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4.5 w-4.5 text-zinc-400" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-black/10 bg-transparent py-2.5 pr-3.5 pl-10 text-sm outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/15 dark:focus:border-indigo-400/70"
            />
          </div>
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          minLength={6}
          labelAction={
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Forgot password?
            </Link>
          }
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
          {pending ? "Signing in…" : "Sign in"}
          {!pending && <ArrowRightIcon className="h-4 w-4" />}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        <span className="text-xs font-medium text-zinc-400">OR</span>
        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
      </div>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
