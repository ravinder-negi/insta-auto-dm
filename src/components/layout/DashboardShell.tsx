"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  BoltIcon,
  ChevronDownIcon,
  CloseIcon,
  GiftIcon,
  HomeIcon,
  LayersIcon,
  LinkIcon,
  PaletteIcon,
  SettingsIcon,
  ShareIcon,
  ShoppingBagIcon,
  SignOutIcon,
  UserIcon,
} from "@/components/icons";
import { SignOutDialog } from "./SignOutDialog";
// import { ThemeToggle } from "./ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";
import { UserMenu } from "./UserMenu";

const NAV_COLLAPSE_STORAGE_KEY = "auto-dm-nav-collapsed-groups";
const DOCK_OPEN_STORAGE_KEY = "auto-dm-dock-open";

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

function readDockOpen(): boolean {
  try {
    const stored = localStorage.getItem(DOCK_OPEN_STORAGE_KEY);
    return stored === null ? true : stored === "1";
  } catch {
    return true;
  }
}

type NavGroup = { label: string | null; links: { href: string; label: string; icon: typeof HomeIcon }[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Automation",
    links: [
      { href: "/dashboard/accounts", label: "Accounts", icon: HomeIcon },
      { href: "/dashboard/rules", label: "AutoDMs", icon: BoltIcon },
      { href: "/dashboard/flows", label: "DM Flows", icon: LayersIcon },
    ],
  },
  {
    label: "Link-in-bio",
    links: [
      { href: "/dashboard/profile", label: "Creator profile", icon: UserIcon },
      { href: "/dashboard/links", label: "Links", icon: LinkIcon },
      { href: "/dashboard/socials", label: "Social accounts", icon: ShareIcon },
      { href: "/dashboard/lead-magnets", label: "Lead magnets", icon: GiftIcon },
      { href: "/dashboard/products", label: "Products", icon: ShoppingBagIcon },
      { href: "/dashboard/theme", label: "Design", icon: PaletteIcon },
    ],
  },
];

const SETTINGS_NAV_GROUP: NavGroup = {
  label: null,
  links: [{ href: "/dashboard/settings", label: "Settings", icon: SettingsIcon }],
};

// Pages reached from a nav link but living outside its href prefix (e.g.
// "View analytics" on Creator profile goes to /dashboard/analytics, not a
// /dashboard/profile/* route) — keep the originating nav item highlighted.
const EXTRA_ACTIVE_PATHS: Record<string, string[]> = {
  "/dashboard/profile": ["/dashboard/analytics"],
};

function isNavLinkActive(href: string, activePath: string) {
  if (activePath.startsWith(href)) return true;
  return (EXTRA_ACTIVE_PATHS[href] ?? []).some((path) => activePath.startsWith(path));
}

const dockItemBase =
  "relative flex items-center gap-3 rounded-2xl text-sm font-semibold transition-colors duration-200";
const dockItemActive = "bg-[var(--primary)] text-white shadow-[0_10px_24px_-10px_color-mix(in srgb, var(--primary) 70%, transparent)]";
const dockItemInactive = "text-[var(--muted-faint)] hover:bg-white/10 hover:text-white";

function DockTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute top-1/2 left-full z-20 ml-3 -translate-y-1/2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[var(--ink)] opacity-0 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.4)] transition-opacity duration-150 group-hover:opacity-100">
      {label}
    </span>
  );
}

export function DashboardShell({
  children,
  userEmail,
  displayName,
  signOutAction,
}: {
  children: ReactNode;
  userEmail: string;
  displayName: string | null;
  signOutAction: () => Promise<void>;
}) {
  const settingsLink = SETTINGS_NAV_GROUP.links[0];
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

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
  // nothing to keep in sync — the toggles just force a re-render.
  const mounted = useMounted();
  const [, bumpCollapsed] = useState(0);
  const collapsedGroups = mounted ? readCollapsedGroups() : {};
  const dockOpen = mounted ? readDockOpen() : true;

  function toggleGroup(label: string) {
    const next = { ...readCollapsedGroups(), [label]: !collapsedGroups[label] };
    try {
      localStorage.setItem(NAV_COLLAPSE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private window / blocked storage — collapse state just won't persist.
    }
    bumpCollapsed((count) => count + 1);
  }

  function toggleDockOpen() {
    const next = !dockOpen;
    try {
      localStorage.setItem(DOCK_OPEN_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Private window / blocked storage — collapse state just won't persist.
    }
    bumpCollapsed((count) => count + 1);
  }

  function sidebarContent(collapsed: boolean) {
    return (
      <>
        <button
          type="button"
          onClick={toggleDockOpen}
          aria-expanded={dockOpen}
          aria-label={dockOpen ? "Collapse menu" : "Expand menu"}
          title={dockOpen ? "Collapse menu" : "Expand menu"}
          className={`flex shrink-0 flex-col items-center gap-1 pt-3 pb-2 text-[#6B6680] transition-colors hover:text-white ${
            collapsed ? "" : "px-4"
          }`}
        >
          <ChevronIcon className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${dockOpen ? "-rotate-90" : "rotate-90"}`} />
        </button>

        <button
          type="button"
          onClick={toggleDockOpen}
          aria-expanded={dockOpen}
          aria-label={dockOpen ? "Collapse menu" : "Expand menu"}
          className={`flex w-full shrink-0 items-center gap-3 px-4 pb-5 ${collapsed ? "justify-center px-0" : ""}`}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <BoltIcon className="h-5 w-5 text-white" />
          </span>
          {!collapsed && (
            <span className="min-w-0 text-left">
              <span className="block text-base font-bold tracking-tight text-white">Auto DM</span>
              <span className="block truncate text-[11px]" style={{ color: "#8F8AA3" }}>
                Engage. Automate. Grow.
              </span>
            </span>
          )}
        </button>

        <div
          className={`flex min-h-0 flex-1 flex-col ${collapsed ? "" : "thin-scrollbar overflow-y-auto"}`}
        >
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {NAV_GROUPS.map((group, groupIndex) => {
              const label = group.label;
              const isCollapsed = !collapsed && label ? Boolean(collapsedGroups[label]) : false;

              return (
                <div
                  key={label ?? groupIndex}
                  className={
                    groupIndex === 0
                      ? ""
                      : collapsed
                        ? "mt-2 flex justify-center border-t border-white/10 pt-2"
                        : "mt-4 border-t border-white/10 pt-4"
                  }
                >
                  {label && !collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(label)}
                      aria-expanded={!isCollapsed}
                      className="flex w-full items-center justify-between px-4 pb-2 text-[11px] font-semibold tracking-[0.1em] text-[#8F8AA3] uppercase transition-colors hover:text-white"
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
                    <div className={`flex flex-col gap-1 ${collapsed ? "items-center" : ""}`}>
                      {group.links.map((link) => {
                        const active = isNavLinkActive(link.href, activePath);
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => navigate(link.href)}
                            aria-current={active ? "page" : undefined}
                            title={collapsed ? link.label : undefined}
                            className={`group ${dockItemBase} ${active ? dockItemActive : dockItemInactive} ${
                              collapsed ? "h-11 w-11 justify-center" : "px-4 py-3"
                            }`}
                          >
                            <link.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && link.label}
                            {collapsed && <DockTooltip label={link.label} />}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className={`shrink-0 border-t border-white/10 px-3 py-3 ${collapsed ? "flex justify-center" : ""}`}>
          {(() => {
            const active = activePath.startsWith(settingsLink.href);
            return (
              <Link
                href={settingsLink.href}
                onClick={() => navigate(settingsLink.href)}
                aria-current={active ? "page" : undefined}
                title={collapsed ? settingsLink.label : undefined}
                className={`group ${dockItemBase} ${active ? dockItemActive : dockItemInactive} ${
                  collapsed ? "h-11 w-11 justify-center" : "px-4 py-3"
                }`}
              >
                <settingsLink.icon className="h-5 w-5 shrink-0" />
                {!collapsed && settingsLink.label}
                {collapsed && <DockTooltip label={settingsLink.label} />}
              </Link>
            );
          })()}
        </div>
      </>
    );
  }

  return (
    <ToastProvider>
      <div
        className="dashboard-theme relative flex h-dvh flex-1 overflow-hidden"
        style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
      >
        <aside
          className={`relative z-20 my-4 ml-4 hidden min-h-0 shrink-0 flex-col overflow-hidden rounded-[28px] transition-[width] duration-300 ease-out lg:flex ${
            dockOpen ? "w-64" : "w-20"
          }`}
          style={{ backgroundColor: "var(--ink)" }}
        >
          {sidebarContent(!dockOpen)}
          <button
            type="button"
            onClick={() => setConfirmingSignOut(true)}
            title={dockOpen ? undefined : "Sign out"}
            className={`flex shrink-0 items-center gap-3 border-t border-white/10 px-3 py-3.5 text-sm font-semibold text-[var(--muted-faint)] transition-colors hover:bg-white/10 hover:text-white ${
              dockOpen ? "" : "justify-center"
            }`}
          >
            <SignOutIcon className="h-4 w-4 shrink-0" />
            {dockOpen && "Sign out"}
          </button>
        </aside>

        <SignOutDialog
          open={confirmingSignOut}
          onClose={() => setConfirmingSignOut(false)}
          signOutAction={signOutAction}
        />

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div className="relative flex h-full w-64 flex-col overflow-hidden" style={{ backgroundColor: "var(--ink)" }}>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
                className="absolute top-5 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-faint)] hover:bg-white/10"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
              {sidebarContent(false)}
            </div>
          </div>
        )}

        <div className="relative z-10 flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
          <header
            className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 lg:hidden"
            style={{ borderColor: "var(--dash-border)", backgroundColor: "var(--background)" }}
          >
            <div className="flex items-center gap-2.5">
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
              <UserMenu userEmail={userEmail} displayName={displayName} signOutAction={signOutAction} />
              {/* <ThemeToggle /> */}
            </div>
          </header>

          {pendingHref && (
            <div className="h-0.5 w-full shrink-0 overflow-hidden bg-brand-100 dark:bg-brand-950/60">
              <div className="brand-gradient animate-loading-bar h-full w-1/3" />
            </div>
          )}

          <main
            className={`thin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4 transition-opacity duration-150 sm:px-4 sm:py-5 lg:px-6 [scrollbar-gutter:stable] ${
              pendingHref ? "pointer-events-none opacity-40" : "opacity-100"
            }`}
            style={{ backgroundColor: "var(--background)" }}
          >
            <div className="mx-auto w-full max-w-[1920px]">{children}</div>
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
