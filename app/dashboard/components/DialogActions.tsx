"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./Spinner";

/** Cancel + destructive submit for a confirmation dialog. Must be rendered
 *  inside the `<form action={...}>` it belongs to, so `useFormStatus` picks
 *  up that form's pending state for both buttons. */
export function DialogActions({
  onCancel,
  confirmLabel,
}: {
  onCancel: () => void;
  confirmLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={pending}
        className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending && (
          <Spinner className="h-3.5 w-3.5 border-white/40 border-t-white" />
        )}
        {confirmLabel}
      </button>
    </>
  );
}
