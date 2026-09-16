"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { SignOutIcon } from "./icons";

/** Rendered through a portal, so it must live outside any menu that closes on
 *  outside clicks — otherwise the menu unmounts it before the form submits. */
export function SignOutDialog({
  open,
  onClose,
  signOutAction,
}: {
  open: boolean;
  onClose: () => void;
  signOutAction: () => Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="animate-fade-in-up relative w-full max-w-sm rounded-2xl border border-black/6 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-900">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
          <SignOutIcon className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold tracking-tight">Sign out?</h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          You&apos;ll need to sign in again to access your dashboard.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-500"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
