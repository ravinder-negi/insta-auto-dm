"use client";

import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

/** Back/Next row pinned to the bottom of a step card. Progress lives in the
 *  layout rail, so this stays just the controls. */
export function StepFooter({
  backHref,
  canContinue,
  pending,
  label = "Next",
}: {
  /** Omitted on the first step, which has nothing to go back to. */
  backHref?: string;
  canContinue: boolean;
  pending: boolean;
  label?: string;
}) {
  return (
    <div
      className={`mt-auto flex items-center gap-3 pt-8 ${
        backHref ? "justify-between" : "justify-end"
      }`}
    >
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-black/5 max-sm:flex-1 max-sm:justify-center"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Link>
      )}

      <button
        type="submit"
        disabled={!canContinue || pending}
        className="ha-btn inline-flex items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none max-sm:flex-1"
        style={{ background: "var(--accent)" }}
      >
        {pending ? "Saving…" : label}
        {!pending && (
          <span className="ha-arr inline-flex">
            <ArrowRightIcon className="h-4 w-4" />
          </span>
        )}
      </button>
    </div>
  );
}
