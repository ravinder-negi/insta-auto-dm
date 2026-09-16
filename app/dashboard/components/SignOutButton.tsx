"use client";

import { useState } from "react";
import { SignOutDialog } from "./SignOutDialog";
import { SignOutIcon } from "./icons";

export function SignOutButton({
  signOutAction,
  variant = "icon",
}: {
  signOutAction: () => Promise<void>;
  variant?: "icon" | "text";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 hover:text-black dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <SignOutIcon className="h-4.5 w-4.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/15"
        >
          <SignOutIcon className="h-4 w-4" />
          Sign out
        </button>
      )}

      <SignOutDialog
        open={open}
        onClose={() => setOpen(false)}
        signOutAction={signOutAction}
      />
    </>
  );
}
