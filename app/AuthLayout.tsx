import type { ReactNode } from "react";
import { BrandingPanel } from "./login/BrandingPanel";
import { ThemeToggle } from "./dashboard/components/ThemeToggle";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <div className="order-1 relative flex flex-1 items-center justify-center overflow-hidden bg-[#fbfaff] px-4 py-12 sm:py-16 lg:order-2 dark:bg-black">
        <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        <div className="absolute -top-32 -right-32 h-105 w-105 rounded-full bg-linear-to-br from-brand-200/70 to-transparent blur-3xl" />
        <div className="absolute top-[32%] right-[8%] h-64 w-64 rounded-full bg-brand-200/50 blur-2xl" />
        <div className="absolute -bottom-36 -right-20 h-115 w-115 rounded-full bg-linear-to-tl from-brand-100/80 to-transparent blur-3xl" />
        <div className="absolute top-[62%] left-10 h-8 w-8 rounded-full bg-brand-200/70 blur-[2px]" />
        <div className="absolute top-1/3 left-16 h-3 w-3 rounded-full bg-brand-300" />
        <div className="absolute top-[16%] right-[26%] h-4 w-4 rounded-full bg-brand-200" />

        {children}
      </div>
      <div className="order-2 lg:order-1 lg:flex-1">
        <BrandingPanel />
      </div>
    </div>
  );
}
