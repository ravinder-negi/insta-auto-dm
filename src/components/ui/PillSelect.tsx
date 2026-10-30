import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/icons";

/** A native `<select>` styled as a pill with a leading icon — used across the
 *  reskinned analytics/executions filters (literal brand hex, no dark mode,
 *  matching the Products/Links filter toolbar). */
export function PillSelect({
  value,
  onChange,
  icon,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--muted)]">
        {icon}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="min-h-[46px] appearance-none rounded-full border-[1.5px] border-[var(--line)] bg-white py-0 pr-9 pl-10 text-sm font-semibold outline-none transition-colors focus:border-[var(--primary)]"
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
    </div>
  );
}
