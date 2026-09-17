import type { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fade-in-up relative z-10 w-full max-w-md rounded-3xl border border-black/6 bg-white p-10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-16px_rgba(80,60,160,0.18)] dark:border-white/8 dark:bg-zinc-900">
      {children}
    </div>
  );
}
