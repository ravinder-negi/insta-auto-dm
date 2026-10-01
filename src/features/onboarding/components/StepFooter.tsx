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
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/5 max-sm:flex-1 max-sm:justify-center dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Link>
      )}

      <button
        type="submit"
        disabled={!canContinue || pending}
        className="brand-gradient inline-flex items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-45 disabled:shadow-none disabled:hover:scale-100 max-sm:flex-1"
      >
        {pending ? "Saving…" : label}
        {!pending && <ArrowRightIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
