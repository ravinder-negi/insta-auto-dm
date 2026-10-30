"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, InstagramIcon } from "@/components/icons";

/** Explains the three permissions Auto DM asks for, then hands off to the
 *  real Instagram Login OAuth redirect at `/api/instagram/connect`. */
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
              className="animate-fade-in-up relative flex w-full max-w-md flex-col gap-5 rounded-3xl bg-white p-8 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6)]"
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
                  You will sign in on Instagram. Auto DM only asks for what it needs:
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  "Read comments on your posts and lives",
                  "Send DMs and replies for you",
                  "View your basic profile details",
                ].map((perm) => (
                  <div key={perm} className="flex items-center gap-3 text-sm">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "var(--success-tint)", color: "var(--success-text)" }}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {perm}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {/* A full page load on purpose: this route redirects off-site to
                    Instagram's OAuth screen, which client-side <Link> can't follow. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/instagram/connect"
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--primary)", boxShadow: "0 16px 30px -12px color-mix(in srgb, var(--primary) 60%, transparent)" }}
                >
                  Continue with Instagram
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
