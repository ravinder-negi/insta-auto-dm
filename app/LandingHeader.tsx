import Link from "next/link";
import { BoltIcon } from "./dashboard/components/icons";

export function LandingHeader() {
  return (
    <header className="flex w-full shrink-0 items-center justify-between px-25 py-4">
      <div className="flex items-center gap-2.5">
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

      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">
          Already have an account?
        </span>
        <Link
          href="/login"
          className="rounded-full border border-zinc-200 px-4 py-2 font-medium text-zinc-900 transition-colors hover:border-transparent hover:bg-[linear-gradient(135deg,#6366f1_0%,#7c3aed_50%,#a855f7_100%)] hover:text-white dark:border-zinc-800 dark:text-zinc-50"
        >
          Log in
        </Link>
      </div>
    </header>
  );
}
