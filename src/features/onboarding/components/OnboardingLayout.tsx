import Link from "next/link";
import type { ReactNode } from "react";
import "@/app/(marketing)/_components/home/animations.css";
import { displayFont, homeCssVars, homeWrapperClass } from "@/app/(marketing)/_components/home/fonts";
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
    <div
      className={`${homeWrapperClass} relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 sm:py-8`}
      style={{
        ...homeCssVars,
        backgroundImage: "radial-gradient(rgba(21,19,28,.07) 1.2px, transparent 1.2px)",
        backgroundSize: "30px 30px",
      }}
    >
      <div className="ha-blob1 pointer-events-none absolute -top-35 -left-35 h-115 w-115 rounded-full bg-[var(--accent)] opacity-20 blur-[120px]" />
      <div className="ha-blob2 pointer-events-none absolute -right-35 -bottom-40 h-120 w-120 rounded-full bg-[var(--violet)] opacity-25 blur-[120px]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 lg:flex-row lg:gap-6">
        <aside className="ha-fadeup hidden w-64 shrink-0 flex-col gap-5 rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-28px_rgba(21,19,28,.25)] lg:flex">
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
                  className="flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors"
                  style={
                    current
                      ? { background: "color-mix(in srgb, var(--accent) 8%, white)" }
                      : undefined
                  }
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={
                      done
                        ? {
                            background: "color-mix(in srgb, var(--accent) 16%, white)",
                            color: "var(--accent)",
                          }
                        : current
                          ? { background: "var(--accent)", color: "#fff" }
                          : { border: "1px solid rgba(21,19,28,.12)", color: "#A7A2B8" }
                    }
                  >
                    {done ? <CheckIcon className="h-3.5 w-3.5" /> : position}
                  </span>

                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: current || done ? "var(--ink)" : "#A7A2B8" }}
                    >
                      {item.label}
                    </p>
                    {current && (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{item.hint}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div
            className="mt-auto rounded-2xl p-4"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, white), color-mix(in srgb, var(--violet) 10%, white))",
            }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
              {meta.promo.emoji}
            </span>
            <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{meta.promo.title}</p>
            <p className="text-xs text-[var(--muted)]">{meta.promo.body}</p>
            <ProgressBar percent={percent} className="mt-4" />
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
              <span>
                Step {step} of {TOTAL}
              </span>
              <span>{percent}%</span>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-3.5 py-3 shadow-sm lg:hidden">
            {backHref ? (
              <Link
                href={backHref}
                aria-label="Back"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition-colors hover:bg-black/5"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            ) : (
              <BrandMark compact />
            )}

            <ProgressBar percent={percent} className="flex-1" />

            <span className="shrink-0 text-xs font-medium text-[var(--muted)]">
              Step {step} of {TOTAL}
            </span>
            <SignOutButton signOutAction={signOut} />
          </header>

          <main className="ha-fadeup ha-d1 flex flex-1 flex-col">{children}</main>
        </div>
      </div>
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
        <BoltIcon className="h-4 w-4" />
      </span>
      <span
        className={`${displayFont} truncate text-sm font-semibold tracking-tight text-[var(--ink)] ${
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
      className={`block h-1.5 overflow-hidden rounded-full bg-black/8 ${className}`}
    >
      <span
        className="block h-full rounded-full transition-all duration-500"
        style={{ width: `${percent}%`, background: "var(--accent)" }}
      />
    </span>
  );
}

export function OnboardingCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-28px_rgba(21,19,28,.25)] sm:p-8">
      {children}
    </div>
  );
}
