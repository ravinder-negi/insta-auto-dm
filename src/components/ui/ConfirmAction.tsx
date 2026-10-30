"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertIcon } from "@/components/icons";
import { DialogActions } from "./DialogActions";

export function ConfirmAction({
  action,
  trigger,
  title,
  description,
  confirmLabel,
  className = "",
}: {
  action: () => Promise<void>;
  /** Rendered as the clickable element that opens the dialog. */
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <span className={className} onClick={() => setOpen(true)}>
        {trigger}
      </span>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-[rgba(21,19,28,0.5)] backdrop-blur-[3px]"
            />
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-action-title"
              aria-describedby="confirm-action-description"
              className="animate-fade-in-up relative flex w-full max-w-[28.75rem] flex-col gap-3.5 rounded-[30px] bg-white p-8 shadow-[0_50px_90px_-30px_rgba(21,19,28,0.7)] dark:border dark:border-white/10 dark:bg-zinc-900"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-tint-faint)] text-[var(--danger-strong)] dark:bg-rose-500/15 dark:text-rose-400">
                <AlertIcon className="h-[26px] w-[26px]" />
              </span>
              <h2
                id="confirm-action-title"
                className="font-display mt-1.5 text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em]"
              >
                {title}
              </h2>
              <p
                id="confirm-action-description"
                className="m-0 text-base leading-[1.55] text-[var(--muted)] dark:text-zinc-400"
              >
                {description}
              </p>

              <form action={action} className="mt-3.5 flex justify-end gap-2.5">
                <DialogActions
                  onCancel={() => setOpen(false)}
                  confirmLabel={confirmLabel}
                  variant="danger"
                />
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
