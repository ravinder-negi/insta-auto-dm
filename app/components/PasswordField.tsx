"use client";

import { useState } from "react";
import { LockIcon } from "@/app/dashboard/components/icons";

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  minLength,
  labelAction,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  labelAction?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <LockIcon className="pointer-events-none absolute inset-y-0 left-3.5 my-auto h-4.5 w-4.5 text-zinc-400" />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          placeholder="Enter your password"
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-black/10 bg-transparent py-2.5 pr-10 pl-10 text-sm outline-none transition-all duration-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/15 dark:focus:border-brand-400/70"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 12s3.75-7 10.5-7 10.5 7 10.5 7-3.75 7-10.5 7-10.5-7-10.5-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58a3 3 0 004.24 4.24" />
      <path d="M9.88 5.09A10.7 10.7 0 0112 5c6.75 0 10.5 7 10.5 7a13.5 13.5 0 01-4.09 4.59M6.6 6.6C3.94 8.28 1.5 12 1.5 12a13.36 13.36 0 004.32 4.86" />
    </svg>
  );
}
