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
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--neutral-tint)] text-[var(--muted)]">
        <GlobeIcon className="h-5 w-5" />
      </span>

      <div>
        <p className="m-0 text-sm font-bold">No tagged traffic yet</p>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
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
              className="flex items-center gap-2 rounded-2xl border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[11px] font-bold tracking-wide text-[var(--muted-soft)] uppercase">
                  {example.label}
                </p>
                <p className="m-0 truncate font-mono text-xs text-[var(--muted)]">{url}</p>
              </div>
              <button
                type="button"
                title="Copy link"
                aria-label={`Copy ${example.label} link`}
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  toast.info("Link copied.");
                }}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[var(--line)] bg-white text-[var(--muted)] transition-colors hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-soft-bg)] hover:text-[var(--secondary)]"
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
