"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./Spinner";

/** Cancel + submit for a confirmation dialog. Must be rendered inside the
 *  `<form action={...}>` it belongs to, so `useFormStatus` picks up that
 *  form's pending state for both buttons.
 *
 *  `variant` matches the Confirm dialogs reference: "danger" (the default —
 *  disconnect/delete/remove) gets the crimson confirm button, "neutral"
 *  (sign out — not destructive) gets a solid ink button instead. */
export function DialogActions({
  onCancel,
  confirmLabel,
  variant = "danger",
}: {
  onCancel: () => void;
  confirmLabel: string;
  variant?: "danger" | "neutral";
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="min-h-12 rounded-full border-[1.5px] border-[var(--line)] bg-white px-6 text-[15px] font-bold text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex min-h-12 min-w-[124px] items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold text-white transition-[transform,filter] disabled:pointer-events-none disabled:opacity-80 hover:-translate-y-0.5 hover:brightness-[1.06] ${
          variant === "danger" ? "bg-[var(--danger-strong)]" : "bg-[var(--ink)]"
        }`}
      >
        {pending && (
          <Spinner className="h-3.5 w-3.5 border-white/40 border-t-white" />
        )}
        {confirmLabel}
      </button>
    </>
  );
}
