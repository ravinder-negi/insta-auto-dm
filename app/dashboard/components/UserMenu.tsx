"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { SignOutDialog } from "./SignOutDialog";
import { ChevronDownIcon, SignOutIcon } from "./icons";

export function UserMenu({
  userEmail,
  signOutAction,
}: {
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex max-w-56 items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        <Avatar name={userEmail} size="sm" />
        <span className="hidden truncate text-sm text-zinc-600 sm:block dark:text-zinc-300">
          {userEmail}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in-up absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-black/6 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2">
            <Avatar name={userEmail} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {userEmail.split("@")[0]}
              </p>
              <p className="truncate text-xs text-zinc-500">{userEmail}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-black/6 dark:bg-white/8" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmingSignOut(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/15"
          >
            <SignOutIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}

      {/* Outside the `open` block: the menu closes the moment the item is
          clicked, and the dialog has to survive that. */}
      <SignOutDialog
        open={confirmingSignOut}
        onClose={() => setConfirmingSignOut(false)}
        signOutAction={signOutAction}
      />
    </div>
  );
}
