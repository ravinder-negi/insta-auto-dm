"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  BoltIcon,
  ChartIcon,
  ChevronDownIcon,
  ClockIcon,
  CloseIcon,
  GiftIcon,
  HomeIcon,
  InstagramIcon,
  LayersIcon,
  LinkIcon,
  PaletteIcon,
  SettingsIcon,
  ShareIcon,
  UserIcon,
} from "./components/icons";
import { ThemeToggle } from "./components/ThemeToggle";
import { ToastProvider } from "./components/Toast";
import { UserMenu } from "./components/UserMenu";

const NAV_COLLAPSE_STORAGE_KEY = "auto-dm-nav-collapsed-groups";

const noopSubscribe = () => () => {};

// Server and the first client render must agree (React hydrates the two),
// so this starts `false` everywhere and flips to `true` right after mount —
// same trick Toast.tsx uses for portal rendering.
function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function readCollapsedGroups(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(NAV_COLLAPSE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

const NAV_GROUPS: { label: string | null; links: { href: string; label: string; icon: typeof HomeIcon }[] }[] = [
  {
    label: "Automation",
    links: [
      { href: "/dashboard/accounts", label: "Accounts", icon: HomeIcon },
      { href: "/dashboard/rules", label: "Rules", icon: BoltIcon },
      { href: "/dashboard/flows", label: "DM Flows", icon: LayersIcon },
      { href: "/dashboard/executions", label: "Executions", icon: ClockIcon },
      { href: "/dashboard/analytics", label: "Analytics", icon: ChartIcon },
    ],
  },
  {
    label: "Link-in-bio",
    links: [
      { href: "/dashboard/profile", label: "Creator profile", icon: UserIcon },
      { href: "/dashboard/links", label: "Links", icon: LinkIcon },
      { href: "/dashboard/socials", label: "Social accounts", icon: ShareIcon },
      { href: "/dashboard/theme", label: "Design", icon: PaletteIcon },
      { href: "/dashboard/lead-magnets", label: "Lead magnets", icon: GiftIcon },
    ],
  },
  {
    label: null,
    links: [{ href: "/dashboard/settings", label: "Settings", icon: SettingsIcon }],
  },
];

export function DashboardShell({
  children,
  userEmail,
  signOutAction,
}: {
  children: ReactNode;
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Highlight the clicked tab the instant it's clicked, instead of
  // waiting for the route's data to finish loading and the URL to commit.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [committedPathname, setCommittedPathname] = useState(pathname);
  if (pathname !== committedPathname) {
    setCommittedPathname(pathname);
    setPendingHref(null);
    // Also covers back/forward, which never runs `navigate`.
    setMobileNavOpen(false);
  }
  const activePath = pendingHref ?? pathname;

  function navigate(href: string) {
    setPendingHref(href);
    setMobileNavOpen(false);
  }

  // Read fresh on every render instead of mirroring into state, so there's
  // nothing to keep in sync — `bumpCollapsed` just forces the re-render.
  const mounted = useMounted();
  const [, bumpCollapsed] = useState(0);
  const collapsedGroups = mounted ? readCollapsedGroups() : {};

  function toggleGroup(label: string) {
    const next = { ...readCollapsedGroups(), [label]: !collapsedGroups[label] };
    try {
      localStorage.setItem(NAV_COLLAPSE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private window / blocked storage — collapse state just won't persist.
    }
    bumpCollapsed((count) => count + 1);
  }

  const sidebar = (
    <>
      <Link
        href="/dashboard/accounts"
        onClick={() => navigate("/dashboard/accounts")}
        className="flex shrink-0 items-center gap-3 px-6 py-6"
      >
        <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_6px_16px_-4px_rgba(99,102,241,0.6)]">
          <BoltIcon className="h-5 w-5 text-white" />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-bold tracking-tight">
            Auto DM
          </span>
          <span className="block truncate text-[11px] text-zinc-400 dark:text-zinc-500">
            Engage. Automate. Grow.
          </span>
        </span>
      </Link>

      <div className="thin-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_GROUPS.map((group, groupIndex) => {
            const label = group.label;
            const isCollapsed = label ? Boolean(collapsedGroups[label]) : false;

            return (
            <div
              key={label ?? groupIndex}
              className={groupIndex === 0 ? "" : "mt-4 border-t border-black/6 pt-4 dark:border-white/8"}
            >
              {label && (
                <button
                  type="button"
                  onClick={() => toggleGroup(label)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center justify-between px-4 pb-2 text-[11px] font-semibold tracking-[0.1em] text-zinc-400 uppercase transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  {label}
                  <ChevronDownIcon
                    className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>
              )}
              {!isCollapsed && (
                <div className="flex flex-col gap-1">
                  {group.links.map((link) => {
                    const active = activePath.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => navigate(link.href)}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                          active
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                            : "text-zinc-500 hover:bg-black/4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1.5 bottom-1.5 -left-3 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
                        )}
                        <link.icon className="h-5 w-5 shrink-0" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl bg-gradient-to-b from-indigo-50 to-violet-50 p-4 dark:from-indigo-500/10 dark:to-violet-500/10">
          <span className="ig-gradient flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[0_6px_16px_-4px_rgba(220,39,67,0.5)]">
            <InstagramIcon className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm leading-snug font-semibold">
            Turn comments
            <br />
            into conversations
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Automate your Instagram growth with AI.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <ToastProvider>
      <div className="relative flex h-dvh flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <aside className="relative z-20 hidden h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-black/6 bg-white lg:flex dark:border-white/8 dark:bg-zinc-900/60">
          {sidebar}
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div className="relative flex h-full w-64 flex-col overflow-hidden border-r border-black/6 bg-white dark:border-white/8 dark:bg-zinc-900">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
                className="absolute top-5 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
              {sidebar}
            </div>
          </div>
        )}

        <div className="relative z-10 flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-black/6 bg-white px-4 py-3 sm:px-6 lg:justify-end lg:px-8 dark:border-white/8 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2.5 lg:hidden">
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setMobileNavOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg">
                <BoltIcon className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-bold tracking-tight">Auto DM</span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <UserMenu userEmail={userEmail} signOutAction={signOutAction} />
              <ThemeToggle />
            </div>
          </header>

          {pendingHref && (
            <div className="h-0.5 w-full shrink-0 overflow-hidden bg-indigo-100 dark:bg-indigo-950/60">
              <div className="brand-gradient animate-loading-bar h-full w-1/3" />
            </div>
          )}

          <main
            className={`app-surface thin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-6 transition-opacity duration-150 sm:px-4 sm:py-8 lg:px-6 ${
              pendingHref ? "pointer-events-none opacity-40" : "opacity-100"
            }`}
          >
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
