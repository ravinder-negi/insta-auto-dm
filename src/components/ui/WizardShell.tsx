"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@/components/icons";

export interface WizardStepMeta {
  title: string;
  description: string;
}

const LINE = "var(--line)";
const INK = "var(--ink)";
const MUTED = "var(--muted)";
const ACCENT = "var(--primary)";

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
  stepValid,
  onStepSelect,
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
  /** Per-step completeness, same order as `steps`. Enables clicking the rail:
   *  a step is reachable only once every step before it is valid, so a user
   *  can't jump ahead past unfinished info. Going back is always allowed. */
  stepValid?: boolean[];
  onStepSelect?: (index: number) => void;
  children: ReactNode;
}) {
  const meta = steps[current];
  const percent = Math.round(((current + 1) / steps.length) * 100);

  // Reachable: a past/current step always, a future step only when every step
  // before it is complete.
  function canGoTo(index: number) {
    if (!onStepSelect || index === current) return false;
    if (index < current) return true;
    return (stepValid ?? []).slice(0, index).every(Boolean);
  }

  return (
    <div
      className="flex flex-col rounded-[30px] border bg-white shadow-[0_24px_60px_-40px_color-mix(in srgb, var(--ink) 35%, transparent)]"
      style={{ borderColor: LINE }}
    >
      <div className="border-b px-5 py-4 sm:px-7 sm:py-5" style={{ borderColor: LINE }}>
        <ol className="flex items-center gap-2 sm:gap-3">
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;
            const reachable = canGoTo(index);

            return (
              <li
                key={step.title}
                aria-current={active ? "step" : undefined}
                className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
              >
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={reachable ? () => onStepSelect?.(index) : undefined}
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                  className={`flex min-w-0 items-center gap-2 rounded-full text-left sm:gap-3 ${reachable ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${reachable ? "hover:ring-2 hover:ring-[color-mix(in_srgb,var(--primary)_35%,transparent)]" : ""}`}
                    style={
                      done
                        ? { backgroundColor: "var(--tint2)", color: "var(--violet)" }
                        : active
                          ? { backgroundColor: ACCENT, color: "#fff" }
                          : { border: `1px solid ${LINE}`, color: "var(--muted-soft)" }
                    }
                  >
                    {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span
                    className={`hidden min-w-0 truncate text-xs font-semibold sm:block ${reachable ? "hover:underline" : ""}`}
                    style={{ color: active || done ? INK : "var(--muted-soft)" }}
                  >
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="h-px flex-1"
                    style={{ backgroundColor: done ? "#CFC6F5" : LINE }}
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
          className="mt-4 block h-1.5 overflow-hidden rounded-full sm:hidden"
          style={{ backgroundColor: "var(--neutral-tint)" }}
        >
          <span
            className="block h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%`, backgroundColor: ACCENT }}
          />
        </span>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <h2 className="text-lg font-bold tracking-tight" style={{ color: INK }}>
          {meta.title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          {meta.description}
        </p>

        <div key={current} className="animate-fade-in-up mt-6">
          {children}
        </div>

        {error && (
          <p
            className="animate-fade-in-up mt-5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold"
            style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-tint-faint)", color: "var(--danger-deep)" }}
          >
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-7" style={{ borderColor: LINE }}>
        <span className="hidden text-xs font-medium sm:block" style={{ color: MUTED }}>
          Step {current + 1} of {steps.length}
        </span>

        <div className="flex flex-1 items-center justify-end gap-2.5 max-sm:flex-row-reverse">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/4 max-sm:flex-1 max-sm:justify-center"
              style={{ borderColor: LINE, color: INK }}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
          ) : onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/4 max-sm:flex-1 max-sm:justify-center"
              style={{ borderColor: LINE, color: INK }}
            >
              Cancel
            </button>
          ) : (
            <Link
              href={cancelHref ?? "/dashboard/rules"}
              className="inline-flex items-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/4 max-sm:flex-1 max-sm:justify-center"
              style={{ borderColor: LINE, color: INK }}
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
            className="inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-45 disabled:hover:scale-100 max-sm:flex-1"
            style={{ backgroundColor: ACCENT, boxShadow: "0 16px 30px -12px color-mix(in srgb, var(--primary) 60%, transparent)" }}
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
    <div
      className="flex flex-col rounded-[30px] border bg-white shadow-[0_24px_60px_-40px_color-mix(in srgb, var(--ink) 35%, transparent)]"
      style={{ borderColor: LINE }}
    >
      <div className="border-b px-5 py-4 sm:px-7 sm:py-5" style={{ borderColor: LINE }}>
        <ol className="flex items-center gap-2 sm:gap-3">
          {Array.from({ length: stepCount }).map((_, index) => (
            <li key={index} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <span className="h-7 w-7 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: "var(--neutral-tint)" }} />
              <span className="hidden h-3 w-16 min-w-0 animate-pulse rounded-full sm:block" style={{ backgroundColor: "var(--neutral-tint)" }} />
              {index < stepCount - 1 && (
                <span aria-hidden="true" className="h-px flex-1" style={{ backgroundColor: LINE }} />
              )}
            </li>
          ))}
        </ol>

        <span className="mt-4 block h-1.5 overflow-hidden rounded-full sm:hidden" style={{ backgroundColor: "var(--neutral-tint)" }}>
          <span className="block h-full w-1/4 animate-pulse rounded-full" style={{ backgroundColor: "#E1D9FB" }} />
        </span>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <div className="h-5 w-40 animate-pulse rounded-full" style={{ backgroundColor: "var(--neutral-tint)" }} />
        <div className="mt-2.5 h-3.5 w-64 max-w-full animate-pulse rounded-full" style={{ backgroundColor: "var(--neutral-tint)" }} />

        <div className="mt-6 flex flex-col gap-3">
          <div className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--bg)" }} />
          <div className="h-11 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg)" }} />
          <div className="h-11 w-2/3 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg)" }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-7" style={{ borderColor: LINE }}>
        <span className="hidden h-3 w-16 animate-pulse rounded-full sm:block" style={{ backgroundColor: "var(--neutral-tint)" }} />
        <div className="flex flex-1 items-center justify-end gap-2.5 max-sm:flex-row-reverse">
          <span className="h-10 w-20 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: "var(--bg)" }} />
          <span className="h-10 w-28 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: "var(--neutral-tint)" }} />
        </div>
      </div>
    </div>
  );
}
