"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertIcon } from "./icons";
import { DialogActions } from "./DialogActions";

export function ConfirmAction({
  action,
  trigger,
  title,
  description,
  confirmLabel,
}: {
  action: () => Promise<void>;
  /** Rendered as the clickable element that opens the dialog. */
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
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
      <span onClick={() => setOpen(true)}>{trigger}</span>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div className="animate-fade-in-up relative w-full max-w-sm rounded-2xl border border-black/6 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <AlertIcon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold tracking-tight">{title}</h2>
              <p className="mt-1.5 text-sm text-zinc-500">{description}</p>

              <form action={action} className="mt-6 flex justify-end gap-2">
                <DialogActions
                  onCancel={() => setOpen(false)}
                  confirmLabel={confirmLabel}
                />
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
