import type { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="ha-fadeup ha-d2 relative z-10 flex w-full min-w-0 max-w-112.5 flex-col gap-6 rounded-[32px] border border-[var(--line)] bg-white p-7 shadow-[0_40px_80px_-40px_rgba(21,19,28,.4)] sm:p-10">
      {children}
    </div>
  );
}
