"use client";

import { useState } from "react";
import Link from "next/link";
import { BoltIcon } from "@/components/icons";
import { displayFont } from "./fonts";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/#leads", label: "Lead capture" },
  { href: "/#analytics", label: "Analytics" },
];

export function HomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 w-full border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8">
        <a
          href="/#top"
          className={`${displayFont} flex items-center gap-2.5 text-2xl font-extrabold tracking-[-0.02em]`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[var(--accent)] text-white">
            <BoltIcon className="h-5 w-5" />
          </span>
          <span>Auto DM</span>
        </a>

        <nav className="hidden items-center gap-7 text-base font-medium text-[var(--muted)] lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[var(--accent)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden min-h-11 items-center px-4 font-semibold sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="hidden min-h-11 items-center rounded-full bg-[var(--ink)] px-5.5 font-semibold text-white sm:inline-flex"
          >
            Get started
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="home-mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div
            id="home-mobile-nav"
            className="order-last flex w-full flex-col gap-1 border-t border-[var(--line)] pt-4 text-base font-medium text-[var(--muted)] lg:hidden"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-1 py-2.5 transition-colors hover:text-[var(--accent)]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-3 sm:hidden">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="min-h-11 flex-1 rounded-full border border-[var(--ink)] px-4 text-center font-semibold whitespace-nowrap text-[var(--ink)] inline-flex items-center justify-center"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="min-h-11 flex-1 rounded-full bg-[var(--ink)] px-4 text-center font-semibold whitespace-nowrap text-white inline-flex items-center justify-center"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
