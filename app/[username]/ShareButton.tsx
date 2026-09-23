"use client";

import { useState } from "react";
import { ShareIcon } from "../dashboard/components/icons";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="fixed top-5 right-5 z-10 flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-[0_4px_16px_-6px_rgba(24,24,60,0.25)] ring-1 ring-black/5 backdrop-blur transition-transform hover:scale-105 active:scale-95 dark:bg-zinc-900/80 dark:text-zinc-200 dark:ring-white/10"
    >
      <ShareIcon className="h-4 w-4" />
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
