import Link from "next/link";
import { ArrowRightIcon, BoltIcon } from "./dashboard/components/icons";
import { ThemeToggle } from "./dashboard/components/ThemeToggle";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#why-choose", label: "Benefits" },
  { href: "#faq", label: "FAQ" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 flex w-full shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white/80 px-6 py-4 backdrop-blur-md sm:px-10 lg:px-25 dark:border-zinc-800 dark:bg-zinc-950/80">
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

      <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 lg:flex dark:text-zinc-400">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/login"
          className="rounded-full border border-zinc-200 px-4 py-2 font-medium text-zinc-900 transition-colors hover:border-transparent hover:bg-[linear-gradient(135deg,var(--color-brand-gradient-from)_0%,var(--color-brand-gradient-via)_50%,var(--color-brand-gradient-to)_100%)] hover:text-white dark:border-zinc-800 dark:text-zinc-50"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="brand-gradient hidden items-center gap-1.5 rounded-full px-4 py-2 font-semibold text-white shadow-sm shadow-brand-500/30 transition-transform hover:scale-[1.02] sm:inline-flex"
        >
          Get started
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
