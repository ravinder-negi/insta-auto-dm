"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@/components/icons";

export interface WizardStepMeta {
  title: string;
  description: string;
}

/** Card chrome shared by every wizard step: the step rail on top, the step's
 *  own body in the middle, Back/Next pinned to the bottom. */
export function WizardShell({
  steps,
  current,
  onBack,
  onNext,
  canContinue,
  pending,
  nextLabel = "Next",
  cancelHref,
  onCancel,
  error,
  children,
}: {
  steps: WizardStepMeta[];
  /** 0-based index of the visible step. */
  current: number;
  /** Omitted on the first step, which falls back to the cancel link/button. */
  onBack?: () => void;
  /** Omitted on the last step, where the footer submits the form instead. */
  onNext?: () => void;
  canContinue: boolean;
  pending: boolean;
  nextLabel?: string;
  /** Renders cancel as a link — used on the standalone wizard pages. */
  cancelHref?: string;
  /** Renders cancel as a button — used when the wizard runs inside a modal. */
  onCancel?: () => void;
  error?: string;
  children: ReactNode;
}) {
  const meta = steps[current];
  const percent = Math.round(((current + 1) / steps.length) * 100);

  return (
    <div className="flex flex-col rounded-3xl border border-black/6 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05),0_24px_60px_-40px_rgba(80,60,160,0.35)] dark:border-white/8 dark:bg-white/4">
      <div className="border-b border-black/6 px-5 py-4 sm:px-7 sm:py-5 dark:border-white/8">
        <ol className="flex items-center gap-2 sm:gap-3">
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;

            return (
              <li
                key={step.title}
                aria-current={active ? "step" : undefined}
                className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done
                      ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"
                      : active
                        ? "brand-gradient text-white shadow-sm shadow-brand-500/30"
                        : "border border-black/10 text-zinc-400 dark:border-white/15 dark:text-zinc-500"
                  }`}
                >
                  {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={`hidden min-w-0 truncate text-xs font-semibold sm:block ${
                    active || done ? "" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`h-px flex-1 ${
                      done
                        ? "bg-brand-300 dark:bg-brand-500/50"
                        : "bg-black/10 dark:bg-white/12"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <span
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="AutoDM setup progress"
          className="mt-4 block h-1.5 overflow-hidden rounded-full bg-black/8 sm:hidden dark:bg-white/12"
        >
          <span
            className="brand-gradient block h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </span>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <h2 className="text-lg font-bold tracking-tight">{meta.title}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {meta.description}
        </p>

        <div key={current} className="animate-fade-in-up mt-6">
          {children}
        </div>

        {error && (
          <p className="animate-fade-in-up mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/6 px-5 py-4 sm:px-7 dark:border-white/8">
        <span className="hidden text-xs font-medium text-zinc-500 sm:block dark:text-zinc-400">
          Step {current + 1} of {steps.length}
        </span>

        <div className="flex flex-1 items-center justify-end gap-2.5 max-sm:flex-row-reverse">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/5 max-sm:flex-1 max-sm:justify-center dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
          ) : onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/5 max-sm:flex-1 max-sm:justify-center dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          ) : (
            <Link
              href={cancelHref ?? "/dashboard/rules"}
              className="inline-flex items-center rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/5 max-sm:flex-1 max-sm:justify-center dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              Cancel
            </Link>
          )}

          {/* Always a plain button: swapping type to "submit" on the last
              step would let the click that advanced *into* that step fall
              through to the form's default action and submit it. */}
          <button
            type="button"
            onClick={(event) =>
              onNext ? onNext() : event.currentTarget.form?.requestSubmit()
            }
            disabled={!canContinue || pending}
            className="brand-gradient inline-flex items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-45 disabled:shadow-none disabled:hover:scale-100 max-sm:flex-1"
          >
            {pending ? "Saving…" : nextLabel}
            {!pending && onNext && <ArrowRightIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Placeholder matching WizardShell's own chrome — shown while a modal fetches
 *  the data a wizard needs (e.g. accounts, or an existing record to edit), so
 *  the modal doesn't jump in size once the real step rail and content mount. */
export function WizardShellSkeleton({ stepCount }: { stepCount: number }) {
  return (
    <div className="flex flex-col rounded-3xl border border-black/6 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05),0_24px_60px_-40px_rgba(80,60,160,0.35)] dark:border-white/8 dark:bg-white/4">
      <div className="border-b border-black/6 px-5 py-4 sm:px-7 sm:py-5 dark:border-white/8">
        <ol className="flex items-center gap-2 sm:gap-3">
          {Array.from({ length: stepCount }).map((_, index) => (
            <li key={index} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <span className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-black/8 dark:bg-white/10" />
              <span className="hidden h-3 w-16 min-w-0 animate-pulse rounded-full bg-black/8 sm:block dark:bg-white/10" />
              {index < stepCount - 1 && (
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-black/10 dark:bg-white/12"
                />
              )}
            </li>
          ))}
        </ol>

        <span className="mt-4 block h-1.5 overflow-hidden rounded-full bg-black/8 sm:hidden dark:bg-white/12">
          <span className="block h-full w-1/4 animate-pulse rounded-full bg-black/15 dark:bg-white/20" />
        </span>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <div className="h-5 w-40 animate-pulse rounded-full bg-black/10 dark:bg-white/12" />
        <div className="mt-2.5 h-3.5 w-64 max-w-full animate-pulse rounded-full bg-black/8 dark:bg-white/10" />

        <div className="mt-6 flex flex-col gap-3">
          <div className="h-24 animate-pulse rounded-2xl bg-black/6 dark:bg-white/8" />
          <div className="h-11 animate-pulse rounded-xl bg-black/6 dark:bg-white/8" />
          <div className="h-11 w-2/3 animate-pulse rounded-xl bg-black/6 dark:bg-white/8" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/6 px-5 py-4 sm:px-7 dark:border-white/8">
        <span className="hidden h-3 w-16 animate-pulse rounded-full bg-black/8 sm:block dark:bg-white/10" />
        <div className="flex flex-1 items-center justify-end gap-2.5 max-sm:flex-row-reverse">
          <span className="h-10 w-20 shrink-0 animate-pulse rounded-xl bg-black/6 dark:bg-white/8" />
          <span className="h-10 w-28 shrink-0 animate-pulse rounded-xl bg-black/10 dark:bg-white/12" />
        </div>
      </div>
    </div>
  );
}
