import type { ReactNode } from "react";
import Link from "next/link";
import "@/app/(marketing)/_components/home/animations.css";
import "./auth-animations.css";
import { homeCssVars, homeWrapperClass } from "@/app/(marketing)/_components/home/fonts";
import { ArrowLeftIcon } from "@/components/icons";
import { BrandingPanel } from "./BrandingPanel";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${homeWrapperClass} flex min-h-screen flex-col lg:flex-row`}
      style={homeCssVars}
    >
      <div className="hidden lg:flex lg:flex-1 lg:basis-140">
        <BrandingPanel />
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:py-20 lg:basis-130"
        style={{
          backgroundImage: "radial-gradient(#DDD6EC 1.2px, transparent 1.2px)",
          backgroundSize: "30px 30px",
        }}
      >
        <div className="ha-blob1 pointer-events-none absolute -top-35 -right-35 h-115 w-115 rounded-full bg-[var(--tint)] opacity-75 blur-[100px]" />
        <div className="ha-blob2 pointer-events-none absolute -bottom-40 -left-30 h-120 w-120 rounded-full bg-[var(--secondary-pale-border)] opacity-85 blur-[100px]" />
        <div className="ha-float1 pointer-events-none absolute top-[30%] left-[9%] h-3.5 w-3.5 rounded-full bg-[#A99BF2]" />
        <div className="ha-float2 pointer-events-none absolute top-[64%] left-[6%] h-7.5 w-7.5 rounded-full bg-[#D9D0FF]" />
        <div className="ha-float3 pointer-events-none absolute top-[12%] right-[18%] h-4 w-4 rounded-full bg-[#FFA9C4]" />

        <Link
          href="/"
          className="absolute top-8 left-8 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-[var(--muted)] transition-transform hover:-translate-x-1"
        >
          <ArrowLeftIcon className="h-4.5 w-4.5" />
          <span>Back to home</span>
        </Link>

        {children}
      </div>
    </div>
  );
}
