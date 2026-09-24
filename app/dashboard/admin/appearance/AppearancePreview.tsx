import type { CSSProperties } from "react";
import { buildBrandCssVars } from "@/lib/color";
import { primaryButtonClass } from "../../components/styles";
import { BoltIcon, ClockIcon, HomeIcon, PlusIcon } from "../../components/icons";

/** Live mockup of the dashboard chrome, scoped to this element via inline
 *  --color-brand-* overrides — so it updates as the admin clicks a swatch,
 *  with no save and no effect on the rest of the page. */
export function AppearancePreview({ accentColor }: { accentColor: string }) {
  const brandVars = buildBrandCssVars(accentColor) as CSSProperties;

  return (
    <div
      style={brandVars}
      className="app-surface overflow-hidden rounded-2xl border border-black/6 p-5 dark:border-white/8"
    >
      <div className="flex items-center gap-3">
        <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_6px_16px_-4px_rgba(0,0,0,0.35)]">
          <BoltIcon className="h-5 w-5 text-white" />
        </span>
        <span className="brand-text-gradient text-base font-bold tracking-tight">
          Auto DM
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <span className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <HomeIcon className="h-4 w-4 shrink-0" />
          Accounts
        </span>
        <span className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          <ClockIcon className="h-4 w-4 shrink-0" />
          Executions
        </span>
      </div>

      <button type="button" className={`${primaryButtonClass} mt-5 w-full`}>
        <PlusIcon className="h-4 w-4" />
        Connect Instagram account
      </button>
    </div>
  );
}
