"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDownIcon, SearchIcon } from "./icons";

export const fieldClass =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/12 dark:bg-white/5 dark:text-zinc-100 dark:focus:border-indigo-400/70";

export function SearchField({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${fieldClass} pl-10`}
      />
    </div>
  );
}

/** Native select wrapped so it can carry a leading icon and a custom chevron. */
export function SelectField({
  icon,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { icon?: ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400">
          {icon}
        </span>
      )}
      <select
        {...props}
        className={`${fieldClass} appearance-none pr-9 ${icon ? "pl-10" : ""}`}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  tone = "default",
  children,
}: {
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        tone === "danger"
          ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15"
          : "text-zinc-400 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
