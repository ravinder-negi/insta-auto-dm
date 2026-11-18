"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, InfoIcon, InstagramIcon } from "@/components/icons";
import {
  CONNECT_PERMISSIONS,
  CONNECT_REQUIREMENT,
  CONNECT_STEPS,
} from "@/features/accounts/connectSteps";

/** Walks through Meta's Unified Login screens and the three permissions Auto
 *  DM asks for, then hands off to the real redirect at `/api/instagram/connect`. */
export function ConnectAccountButton({
  className,
  style,
  children,
}: {
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} style={style} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Connect Instagram account"
              className="animate-fade-in-up relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6)]"
              style={{ color: "var(--ink)" }}
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <InstagramIcon className="h-7 w-7" />
              </span>
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Connect your Instagram</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                  Secure login through Meta. Takes about a minute.
                </p>
              </div>

              <section aria-labelledby="connect-steps-heading">
                <h4
                  id="connect-steps-heading"
                  className="text-[11px] font-semibold tracking-[0.12em] uppercase"
                  style={{ color: "var(--muted)" }}
                >
                  What you&apos;ll do
                </h4>
                <ol className="mt-3 flex flex-col gap-2.5">
                  {CONNECT_STEPS.map((step, index) => (
                    <li key={step} className="flex items-center gap-3 text-sm">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--primary) 12%, white)",
                          color: "var(--primary)",
                        }}
                      >
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </section>

              <section aria-labelledby="connect-permissions-heading">
                <h4
                  id="connect-permissions-heading"
                  className="text-[11px] font-semibold tracking-[0.12em] uppercase"
                  style={{ color: "var(--muted)" }}
                >
                  Auto DM will be able to
                </h4>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {CONNECT_PERMISSIONS.map((perm) => (
                    <li key={perm} className="flex items-center gap-3 text-sm">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: "var(--success-tint)", color: "var(--success-text)" }}
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                      {perm}
                    </li>
                  ))}
                </ul>
              </section>

              <p
                className="flex items-start gap-2 rounded-2xl px-3.5 py-3 text-xs leading-relaxed"
                style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}
              >
                <InfoIcon className="mt-px h-4 w-4 shrink-0" />
                {CONNECT_REQUIREMENT}
              </p>

              <div className="flex flex-wrap gap-2.5">
                {/* A full page load on purpose: this route redirects off-site to
                    Meta's login screen, which client-side <Link> can't follow. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/instagram/connect"
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--primary)", boxShadow: "0 16px 30px -12px color-mix(in srgb, var(--primary) 60%, transparent)" }}
                >
                  Continue to Meta
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border px-6 text-sm font-semibold transition-colors hover:bg-black/4"
                  style={{ borderColor: "var(--line)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
