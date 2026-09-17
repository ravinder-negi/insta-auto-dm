import { BoltIcon } from "./dashboard/components/icons";

export function AuthBrandHeader() {
  return (
    <div className="mb-6 flex items-center gap-2.5">
      <div className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm shadow-brand-500/30">
        <BoltIcon className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Auto DM
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Engage. Automate. Grow.
        </div>
      </div>
    </div>
  );
}
