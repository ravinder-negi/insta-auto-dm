"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthBrandHeader } from "@/app/AuthBrandHeader";
import { AuthCard } from "@/app/AuthCard";
import { PasswordField } from "@/app/components/PasswordField";
import { ArrowRightIcon, MailIcon, UserIcon } from "@/app/dashboard/components/icons";
import { signUp, type AuthState } from "../login/actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    undefined
  );

  return (
    <AuthCard>
      <AuthBrandHeader />

      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Sign up to get started with Auto DM
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4.5 w-4.5 text-zinc-400" />
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Jane Doe"
              className="w-full rounded-xl border border-black/10 bg-transparent py-2.5 pr-3.5 pl-10 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/15 dark:focus:border-brand-400/70"
            />
          </div>
        </div>

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
              className="w-full rounded-xl border border-black/10 bg-transparent py-2.5 pr-3.5 pl-10 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/15 dark:focus:border-brand-400/70"
            />
          </div>
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
          className="brand-gradient mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
        >
          {pending ? "Creating account…" : "Sign up"}
          {!pending && <ArrowRightIcon className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
