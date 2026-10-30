"use client";

import { useEffect, useRef, useState } from "react";
import { ShareIcon } from "@/components/icons";

export function ShareButton({ title, brandColor }: { title: string; brandColor: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url] = useState(() => (typeof window === "undefined" ? "" : window.location.href));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — the URL text is still visible to copy manually
    }
  }

  return (
    <div ref={panelRef} className="relative" title={title}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-5 text-[15px] font-bold text-[var(--ink)] shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        <ShareIcon className="h-4 w-4" />
        Share
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Share this page"
          className="absolute top-[calc(100%+10px)] right-0 z-20 w-80 max-w-[calc(100vw-2.5rem)] rounded-3xl border border-black/10 bg-white p-5 shadow-[0_30px_60px_-20px_rgba(21,19,28,0.45)]"
        >
          <p className="font-display text-xl font-extrabold tracking-tight text-[var(--ink)]">
            Share this page
          </p>
          <div className="mt-3.5 flex items-center gap-2 rounded-2xl border border-black/10 bg-[var(--line)]/30 py-1.5 pr-1.5 pl-3.5">
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-[var(--muted)]">
              {url}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: brandColor }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
