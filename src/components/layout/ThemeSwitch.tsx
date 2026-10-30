"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

/** Two explicit light/dark buttons for the settings page — same source of
 *  truth as the header's ThemeToggle (the class on `.dashboard-theme`,
 *  DashboardShell's root), just rendered as a pair instead of a single
 *  cycling switch. */
function getShell() {
  return document.querySelector(".dashboard-theme");
}

function subscribe(onChange: () => void) {
  const shell = getShell();
  const observer = new MutationObserver(onChange);
  if (shell) {
    observer.observe(shell, { attributes: true, attributeFilter: ["class"] });
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

function isDarkNow() {
  const classes = getShell()?.classList;
  if (!classes) return false;
  if (classes.contains("dark")) return true;
  if (classes.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function setTheme(theme: "light" | "dark") {
  const shell = getShell();
  if (!shell) return;
  shell.classList.remove("dark", "light");
  shell.classList.add(theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Private mode / blocked storage — the choice still applies for this visit.
  }
}

export function ThemeSwitch() {
  const isDark = useSyncExternalStore(subscribe, isDarkNow, () => false);

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        aria-label="Use light theme"
        title="Light theme"
        className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
        style={
          !isDark
            ? { borderColor: "var(--primary)", backgroundColor: "#fff" }
            : { borderColor: "var(--line)", backgroundColor: "#fff" }
        }
      >
        <SunIcon className={`h-4 w-4 ${!isDark ? "text-[var(--primary)]" : "text-[var(--muted-soft)]"}`} />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        aria-label="Use dark theme"
        title="Dark theme"
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        style={{ backgroundColor: isDark ? "var(--ink)" : "#F3F0EA" }}
      >
        <MoonIcon className={`h-4 w-4 ${isDark ? "text-white" : "text-[var(--muted-soft)]"}`} />
      </button>
    </div>
  );
}
