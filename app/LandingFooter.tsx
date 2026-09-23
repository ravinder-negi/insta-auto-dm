import Link from "next/link";
import { BoltIcon } from "./dashboard/components/icons";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-zinc-200/70 px-6 py-8 sm:px-10 lg:px-25 dark:border-zinc-800">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg text-white">
            <BoltIcon className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Auto DM
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Engage. Automate. Grow.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Contact
          </Link>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} Auto DM. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
