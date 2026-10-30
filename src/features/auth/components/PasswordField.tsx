"use client";

import { useState } from "react";
import { LockIcon } from "@/components/icons";

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  minLength,
  labelAction,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  labelAction?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[15px] font-semibold text-[var(--ink)]">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-[var(--line)] bg-[var(--bg)] pr-1.5 pl-3.5 transition-colors duration-200 focus-within:border-[var(--accent)] focus-within:bg-white focus-within:shadow-[0_0_0_4px_color-mix(in srgb, var(--primary) 14%, transparent)]">
        <LockIcon className="h-5 w-5 flex-none text-[var(--muted)]" />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          placeholder="Password"
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className="min-h-12.5 w-full border-0 bg-transparent py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
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
