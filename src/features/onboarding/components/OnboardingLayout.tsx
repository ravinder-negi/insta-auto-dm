import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, BoltIcon, CheckIcon } from "@/components/icons";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { signOut } from "@/features/auth/actions/login";
import { ONBOARDING_STEPS } from "@/lib/auth/onboarding";

const TOTAL = ONBOARDING_STEPS.length;

/** Sidebar rail on wide screens, progress bar on narrow ones. Index matches
 *  ONBOARDING_STEPS; `promo` is the encouragement card under the rail. */
const STEP_META = [
  {
    label: "Your niche",
    hint: "Let's get to know you",
    promo: {
      emoji: "🪄",
      title: "Create your profile",
      body: "in a few simple steps",
    },
  },
  {
    label: "Your goal",
    hint: "Tell us what you want to achieve",
    promo: {
      emoji: "🎯",
      title: "We'll personalize your dashboard",
      body: "for your goals",
    },
  },
  {
    label: "Connect Instagram",
    hint: "Link your account and go live",
    promo: {
      emoji: "🎉",
      title: "Almost done!",
      body: "One secure login and your automations run.",
    },
  },
];

export function OnboardingLayout({
  step,
  backHref,
  children,
}: {
  /** 1-based position in ONBOARDING_STEPS. */
  step: number;
  /** Shown as the circular back control on narrow screens. */
  backHref?: string;
  children: ReactNode;
}) {
  const percent = Math.round((step / TOTAL) * 100);
  const meta = STEP_META[step - 1];

  return (
    <div className="min-h-screen bg-[#f7f6fc] px-4 py-5 sm:px-6 sm:py-8 dark:bg-black">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 lg:flex-row lg:gap-6">
        <aside className="hidden w-64 shrink-0 flex-col gap-5 rounded-3xl border border-black/6 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-28px_rgba(80,60,160,0.25)] lg:flex dark:border-white/8 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2">
            <BrandMark />
            <SignOutButton signOutAction={signOut} />
          </div>

          <ol className="flex flex-col gap-1">
            {STEP_META.map((item, index) => {
              const position = index + 1;
              const done = position < step;
              const current = position === step;

              return (
                <li
                  key={item.label}
                  aria-current={current ? "step" : undefined}
                  className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                    current ? "bg-brand-50 dark:bg-brand-500/10" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      done
                        ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"
                        : current
                          ? "brand-gradient text-white shadow-sm shadow-brand-500/30"
                          : "border border-black/10 text-zinc-400 dark:border-white/15 dark:text-zinc-500"
                    }`}
                  >
                    {done ? <CheckIcon className="h-3.5 w-3.5" /> : position}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        current || done
                          ? ""
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {item.label}
                    </p>
                    {current && (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {item.hint}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-auto rounded-2xl bg-linear-to-br from-brand-50 to-violet-50 p-4 dark:from-brand-500/10 dark:to-violet-500/10">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm dark:bg-zinc-900">
              {meta.promo.emoji}
            </span>
            <p className="mt-3 text-sm font-semibold">{meta.promo.title}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {meta.promo.body}
            </p>
            <ProgressBar percent={percent} className="mt-4" />
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span>
                Step {step} of {TOTAL}
              </span>
              <span>{percent}%</span>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex items-center gap-3 rounded-2xl border border-black/6 bg-white px-3.5 py-3 shadow-sm lg:hidden dark:border-white/8 dark:bg-zinc-900">
            {backHref ? (
              <Link
                href={backHref}
                aria-label="Back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/8 text-zinc-500 transition-colors hover:bg-black/5 dark:border-white/12 dark:hover:bg-white/10"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            ) : (
              <BrandMark compact />
            )}

            <ProgressBar percent={percent} className="flex-1" />

            <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Step {step} of {TOTAL}
            </span>
            <SignOutButton signOutAction={signOut} />
          </header>

          <main className="animate-fade-in-up flex flex-1 flex-col">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm shadow-brand-500/30">
        <BoltIcon className="h-4 w-4" />
      </span>
      <span
        className={`truncate text-sm font-semibold tracking-tight ${
          compact ? "hidden sm:inline" : ""
        }`}
      >
        Auto DM
      </span>
    </span>
  );
}

function ProgressBar({
  percent,
  className = "",
}: {
  percent: number;
  className?: string;
}) {
  return (
    <span
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Setup progress"
      className={`block h-1.5 overflow-hidden rounded-full bg-black/8 dark:bg-white/12 ${className}`}
    >
      <span
        className="brand-gradient block h-full rounded-full transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

export function OnboardingCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col rounded-3xl border border-black/6 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-28px_rgba(80,60,160,0.25)] sm:p-8 dark:border-white/8 dark:bg-zinc-900">
      {children}
    </div>
  );
}
