"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { SignOutIcon } from "@/components/icons";
import { DialogActions } from "@/components/ui/DialogActions";

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
        className="absolute inset-0 bg-[rgba(21,19,28,0.5)] backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-out-title"
        aria-describedby="sign-out-description"
        className="animate-fade-in-up relative flex w-full max-w-[27.5rem] flex-col gap-3.5 rounded-[30px] bg-white p-8 shadow-[0_50px_90px_-30px_rgba(21,19,28,0.7)] dark:border dark:border-white/10 dark:bg-zinc-900"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tint)] text-[var(--primary)] dark:bg-indigo-500/15 dark:text-indigo-400">
          <SignOutIcon className="h-[26px] w-[26px]" />
        </span>
        <h2
          id="sign-out-title"
          className="font-display mt-1.5 text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em]"
        >
          Sign out?
        </h2>
        <p
          id="sign-out-description"
          className="m-0 text-base leading-[1.55] text-[var(--muted)] dark:text-zinc-400"
        >
          You&apos;ll need to sign in again to access your dashboard.
        </p>

        <form action={signOutAction} className="mt-3.5 flex justify-end gap-2.5">
          <DialogActions onCancel={onClose} confirmLabel="Sign out" variant="danger" />
        </form>
      </div>
    </div>,
    document.body
  );
}
