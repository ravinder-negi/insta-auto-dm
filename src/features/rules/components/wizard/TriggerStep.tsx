"use client";

import {
  BoltIcon,
  CameraIcon,
  CheckIcon,
  VideoCameraIcon,
} from "@/components/icons";
import type { TriggerType } from "./shared";

const TRIGGERS: {
  value: TriggerType;
  icon: typeof BoltIcon;
  tone: string;
  title: string;
  description: string;
}[] = [
  {
    value: "comment_keyword",
    icon: BoltIcon,
    tone: "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300",
    title: "Comments on your Post or Reel",
    description: "Reply with a DM whenever someone comments your keyword.",
  },
  {
    value: "story_reply",
    icon: CameraIcon,
    tone: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    title: "Replies to your Story",
    description: "Reply with a DM whenever someone replies to your story.",
  },
  {
    value: "live_comment",
    icon: VideoCameraIcon,
    tone: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    title: "Comments on your Live",
    description: "Reply with a DM whenever someone comments on your Live.",
  },
];

export function TriggerStep({
  value,
  onChange,
}: {
  value: TriggerType;
  onChange: (triggerType: TriggerType) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Trigger AutoDM when someone…</legend>

      <div className="mt-3 flex flex-col gap-2.5">
        {TRIGGERS.map((trigger) => {
          const active = trigger.value === value;

          return (
            <button
              key={trigger.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(trigger.value)}
              className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 ${
                active
                  ? "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/15 dark:border-brand-400/70 dark:bg-brand-500/10"
                  : "border-black/8 bg-white hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/40 dark:hover:bg-white/10"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${trigger.tone}`}
              >
                <trigger.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{trigger.title}</span>
                <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  {trigger.description}
                </span>
              </span>
              {active && (
                <span className="brand-gradient mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
