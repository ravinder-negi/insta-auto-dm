"use client";

import { CopyIcon, GlobeIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toast";

const EXAMPLES = [
  { label: "Instagram bio", source: "instagram", medium: "bio" },
  { label: "Newsletter", source: "newsletter", medium: "email" },
  { label: "X / Twitter post", source: "twitter", medium: "social" },
];

/** Shown in place of the UTM bar list until any tagged view exists — a
 *  blank list with "add ?utm_source=..." told the reader what to do but not
 *  how; this hands over copyable, working example links for their own URL. */
export function UtmSourceEmptyState({ publicUrl }: { publicUrl: string }) {
  const toast = useToast();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-2 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-white/10 dark:text-zinc-500">
        <GlobeIcon className="h-5 w-5" />
      </span>

      <div>
        <p className="text-sm font-medium">No tagged traffic yet</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Share one of these instead of your plain profile link — each source shows up here
          once someone clicks through.
        </p>
      </div>

      <div className="flex w-full flex-col gap-2">
        {EXAMPLES.map((example) => {
          const url = `${publicUrl}?utm_source=${example.source}&utm_medium=${example.medium}`;
          return (
            <div
              key={example.source}
              className="flex items-center gap-2 rounded-xl border border-black/6 bg-zinc-50/60 px-3 py-2 text-left dark:border-white/8 dark:bg-white/4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                  {example.label}
                </p>
                <p className="truncate font-mono text-xs text-zinc-600 dark:text-zinc-300">
                  {url}
                </p>
              </div>
              <button
                type="button"
                title="Copy link"
                aria-label={`Copy ${example.label} link`}
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  toast.info("Link copied.");
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
              >
                <CopyIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
