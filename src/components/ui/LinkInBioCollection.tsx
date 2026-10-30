"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckIcon, TrashIcon } from "@/components/icons";
import { linkInBioStatus } from "@/lib/linkInBioTheme";

/** Shared building blocks for the Products and Lead magnets collection
 *  pages — status filter chips, status badges, the show/hide toggle, inline
 *  delete confirmation, the circular icon buttons on each card/row, and
 *  multi-select with bulk delete. */

export function StatusChip({
  label,
  dot,
  count,
  active,
  onClick,
}: {
  label: string;
  dot: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[44px] items-center gap-2.5 rounded-full border-[1.5px] py-0 pr-2 pl-4 font-bold transition-transform hover:-translate-y-0.5 ${
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink)]"
      }`}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <span>{label}</span>
      <span
        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[13px] ${
          active ? "bg-white/18 text-white" : "bg-[var(--neutral-tint)] text-[var(--muted)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export function StatusBadgePill({ isActive }: { isActive: boolean }) {
  const meta = isActive ? linkInBioStatus.active : linkInBioStatus.hidden;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-bold"
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

export function ActiveToggle({ isActive, label }: { isActive: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="switch"
      aria-checked={isActive}
      disabled={pending}
      aria-label={label}
      title={label}
      className="relative flex h-[34px] w-14 shrink-0 items-center rounded-full border-0 p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
      style={{ background: isActive ? "var(--success)" : "var(--line)" }}
    >
      <span
        className="block h-[26px] w-[26px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.25)] transition-transform"
        style={{ transform: isActive ? "translateX(22px)" : "translateX(0)" }}
      />
    </button>
  );
}

export function DeleteConfirmBar({
  label,
  onCancel,
  onConfirm,
  compact = false,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2.5 rounded-2xl border-[1.5px] border-[var(--danger-border)] bg-[var(--danger-tint-faint)] ${
        compact ? "px-3.5 py-2" : "px-3.5 py-3"
      }`}
    >
      <span className="flex-1 text-sm font-semibold text-[var(--danger-deep)]">{label}</span>
      <button
        type="button"
        onClick={onCancel}
        className="min-h-[40px] cursor-pointer rounded-xl border-[1.5px] border-[var(--line)] bg-white px-4 font-semibold"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="min-h-[40px] cursor-pointer rounded-xl border-0 bg-[var(--danger-strong)] px-4 font-bold text-white"
      >
        Delete
      </button>
    </div>
  );
}

export function IconCircleButton({
  label,
  onClick,
  tone = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "red" | "star";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "red"
      ? "border-[var(--danger-border)] text-[var(--danger-strong)] hover:bg-[var(--danger-tint)] hover:border-[var(--danger-ring)]"
      : tone === "star"
        ? "border-[#F2D9A4] text-[var(--warning-text)] hover:bg-[var(--warning-tint)] hover:border-[#E8C06A]"
        : "border-[var(--line)] text-[var(--ink)] hover:bg-[var(--secondary-soft-bg)] hover:border-[var(--secondary-border)] hover:text-[var(--violet)]";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] bg-white transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function SelectBox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer h-full w-full cursor-pointer appearance-none rounded-[6px] border-[1.5px] border-[var(--secondary-border)] bg-white transition-colors hover:border-[var(--accent)] checked:border-[var(--accent)] checked:bg-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      />
      <CheckIcon className="pointer-events-none absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
    </span>
  );
}

export function BulkDeleteBar({
  count,
  noun,
  allSelected,
  onToggleAll,
  onClear,
  onDelete,
}: {
  count: number;
  /** Singular item name, e.g. "product" — pluralised with a trailing "s". */
  noun: string;
  allSelected: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const label = `${count} ${noun}${count === 1 ? "" : "s"}`;

  if (confirming) {
    return (
      <DeleteConfirmBar
        label={`Delete ${label}? This can't be undone.`}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onDelete();
        }}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border-[1.5px] border-[var(--accent)] bg-white px-4 py-2.5">
      <SelectBox checked={allSelected} label={`Select all shown ${noun}s`} onChange={onToggleAll} />
      <span className="text-sm font-semibold">{count} selected</span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={onClear}
        className="min-h-[40px] cursor-pointer rounded-xl border-[1.5px] border-[var(--line)] bg-white px-4 font-semibold"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl border-[1.5px] border-[var(--danger-border)] bg-white px-4 font-semibold text-[var(--danger-strong)] hover:bg-[var(--danger-tint)]"
      >
        <TrashIcon className="h-4 w-4" />
        Delete selected
      </button>
    </div>
  );
}
