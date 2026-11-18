"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TrashIcon } from "@/components/icons";
import { DialogActions } from "@/components/ui/DialogActions";
import { deleteAccount, type DeleteAccountState } from "../actions";
import { DELETE_CONFIRMATION } from "../constants";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction] = useActionState<DeleteAccountState, FormData>(
    deleteAccount,
    undefined,
  );

  function close() {
    setOpen(false);
    setConfirmation("");
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setConfirmation("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const confirmed = confirmation.trim() === DELETE_CONFIRMATION;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/15"
      >
        <TrashIcon className="h-4 w-4" />
        Delete account
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Cancel"
              onClick={close}
              className="absolute inset-0 bg-[rgba(21,19,28,0.5)] backdrop-blur-[3px]"
            />
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              aria-describedby="delete-account-description"
              className="animate-fade-in-up relative flex w-full max-w-[30rem] flex-col gap-3.5 rounded-[30px] bg-white p-8 shadow-[0_50px_90px_-30px_rgba(21,19,28,0.7)] dark:border dark:border-white/10 dark:bg-zinc-900"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-tint-faint)] text-[var(--danger-strong)] dark:bg-rose-500/15 dark:text-rose-400">
                <TrashIcon className="h-[26px] w-[26px]" />
              </span>
              <h2
                id="delete-account-title"
                className="font-display mt-1.5 text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em]"
              >
                Delete your account?
              </h2>
              <div
                id="delete-account-description"
                className="flex flex-col gap-2 text-base leading-[1.55] text-[var(--muted)] dark:text-zinc-400"
              >
                <p className="m-0">
                  This permanently deletes your account and everything in it. It can&apos;t
                  be undone.
                </p>
                <ul className="m-0 list-disc space-y-0.5 pl-5 text-sm">
                  <li>Connected Instagram accounts (automations stop immediately)</li>
                  <li>AutoDMs, flows, links, products, and lead magnets</li>
                  <li>Captured leads, conversations, and analytics</li>
                  <li>Your profile and uploaded files</li>
                </ul>
              </div>

              <form
                action={formAction}
                onSubmit={(event) => {
                  if (!confirmed) event.preventDefault();
                }}
                className="mt-2 flex flex-col gap-3.5"
              >
                <label className="flex flex-col gap-1.5 text-sm font-bold">
                  <span>
                    Type <span className="font-mono">{DELETE_CONFIRMATION}</span> to confirm
                  </span>
                  <input
                    name="confirmation"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="off"
                    autoFocus
                    className="min-h-12 rounded-2xl border-[1.5px] border-[var(--line)] bg-white px-4 text-[15px] font-medium outline-none focus:border-[var(--danger-strong)] dark:border-white/15 dark:bg-transparent"
                  />
                </label>

                {state?.error && (
                  <p role="alert" className="m-0 text-sm font-medium text-[var(--danger-strong)]">
                    {state.error}
                  </p>
                )}

                <div
                  className={`flex justify-end gap-2.5 ${confirmed ? "" : "[&_button[type=submit]]:pointer-events-none [&_button[type=submit]]:opacity-50"}`}
                  aria-disabled={!confirmed}
                >
                  <DialogActions onCancel={close} confirmLabel="Delete account" variant="danger" />
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
