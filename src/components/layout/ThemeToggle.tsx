"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

/** The class on `.dashboard-theme` (DashboardShell's root) is the source of
 *  truth (`dark` = explicit choice, anything else = light; the OS preference is
 *  ignored), so
 *  watch it rather than mirroring it. This toggle only ever renders inside
 *  that subtree, post-login. */
function getShell() {
  return document.querySelector(".dashboard-theme");
}

function subscribe(onChange: () => void) {
  const shell = getShell();
  const observer = new MutationObserver(onChange);
  if (shell) {
    observer.observe(shell, { attributes: true, attributeFilter: ["class"] });
  }

  return () => observer.disconnect();
}

function isDarkNow() {
  // Light unless the user explicitly picked dark — OS preference is ignored.
  return getShell()?.classList.contains("dark") ?? false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, isDarkNow, () => false);

  function toggle() {
    const shell = getShell();
    if (!shell) return;
    const next = isDarkNow() ? "light" : "dark";
    shell.classList.remove("dark", "light");
    shell.classList.add(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode / blocked storage: the toggle still works for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
    >
      {isDark ? <MoonIcon className="h-4.5 w-4.5" /> : <SunIcon className="h-4.5 w-4.5" />}
    </button>
  );
}
