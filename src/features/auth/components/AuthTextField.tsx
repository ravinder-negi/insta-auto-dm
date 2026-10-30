import type { ReactNode } from "react";

export function AuthTextField({
  id,
  name,
  label,
  type,
  icon,
  autoComplete,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  type: "email" | "text";
  icon: ReactNode;
  autoComplete: string;
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-semibold text-[var(--ink)]">
        {label}
      </label>
      <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3.5 transition-colors duration-200 focus-within:border-[var(--accent)] focus-within:bg-white focus-within:shadow-[0_0_0_4px_color-mix(in srgb, var(--primary) 14%, transparent)]">
        <span className="flex h-5 w-5 flex-none items-center justify-center text-[var(--muted)]">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="min-h-12.5 w-full border-0 bg-transparent py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
        />
      </div>
    </div>
  );
}
