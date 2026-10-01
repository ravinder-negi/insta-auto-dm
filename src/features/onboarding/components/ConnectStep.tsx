"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  ExternalLinkIcon,
  InstagramIcon,
  SendIcon,
  ShieldIcon,
} from "@/components/icons";
import { OnboardingCard } from "./OnboardingLayout";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/features/onboarding/actions";

const GUARANTEES = [
  "Safe & secure connection via Meta",
  "Read comments, DMs and insights",
  "No password required",
];

/** Shown once an account is linked — the last thing onboarding asks, without a
 *  screen of its own. Both shortcuts finish the flow on the way out. */
const AUTOMATIONS = [
  {
    icon: BoltIcon,
    tone: "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300",
    title: "Comments on your Post or Reel",
    description: "Reply with a DM whenever someone comments your keyword.",
    href: "/dashboard/rules/new",
  },
  {
    icon: SendIcon,
    tone: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
    title: "Someone sends you a DM",
    description: "Run a multi-step DM flow that answers and collects emails.",
    href: "/dashboard/flows/new",
  },
];

export function ConnectStep({
  firstName,
  connected,
  connectError,
}: {
  firstName: string;
  connected: boolean;
  connectError?: string;
}) {
  const [state, formAction, pending] = useActionState<
    OnboardingState,
    FormData
  >(completeOnboarding, undefined);

  return (
    <OnboardingCard>
      <form action={formAction} className="flex flex-1 flex-col">
        {connected ? (
          <>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckIcon className="h-3.5 w-3.5" />
              Instagram connected
            </span>
            <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
              🎉 You&apos;re all set, {firstName}!
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Pick what should trigger your first automation — you can add more
              later from the dashboard.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              🔗 Let&apos;s connect your{" "}
              <span className="brand-text-gradient">Instagram account</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Connect your Instagram Professional account to enable Auto DM and
              every other automation.
            </p>
          </>
        )}

        {(connectError || state?.error) && (
          <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
            {connectError ?? state?.error}
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-black/8 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="ig-gradient flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_14px_30px_-14px_rgba(220,39,67,0.8)]">
                <InstagramIcon className="h-7 w-7" />
              </span>

              <div>
                <p className="text-base font-semibold">
                  Connect with Instagram
                </p>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {GUARANTEES.map((line) => (
                    <li
                      key={line}
                      className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      <CheckIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {connected ? (
              <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckIcon className="h-4 w-4" />
                Connected
              </span>
            ) : (
              <Link
                href="/api/instagram/connect"
                prefetch={false}
                className="brand-gradient inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
              >
                Connect Instagram Account
                <ExternalLinkIcon className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-black/6 pt-4 dark:border-white/10">
            <span className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <ShieldIcon className="h-4 w-4 text-brand-500" />
              Secure login through Meta — we never see your password
            </span>
            <Link
              href="https://help.instagram.com/570895513091465"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Learn more
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {connected ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {AUTOMATIONS.map((automation) => (
              <button
                key={automation.href}
                type="submit"
                name="redirectTo"
                value={automation.href}
                disabled={pending}
                className="flex items-start gap-3.5 rounded-2xl border border-black/8 bg-white p-4 text-left transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/40 dark:hover:bg-white/10"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${automation.tone}`}
                >
                  <automation.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {automation.title}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                    {automation.description}
                  </span>
                </span>
                <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
            In a hurry? Skip this and connect later from Dashboard → Accounts —
            your answers are already saved.
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-8">
          <Link
            href="/onboarding?step=goal"
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            Back
          </Link>

          <button
            type="submit"
            name="redirectTo"
            value="/dashboard"
            disabled={pending}
            className="text-sm font-medium text-zinc-500 underline underline-offset-4 transition-colors hover:text-zinc-800 disabled:opacity-60 dark:hover:text-zinc-200"
          >
            {pending
              ? "One moment…"
              : connected
                ? "Or explore the dashboard"
                : "Skip for now"}
          </button>
        </div>
      </form>
    </OnboardingCard>
  );
}
