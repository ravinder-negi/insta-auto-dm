"use client";

import {
  BoltIcon,
  CameraIcon,
  ChatIcon,
  CheckIcon,
  ShareIcon,
  VideoCameraIcon,
} from "@/components/icons";
import type { TriggerType } from "./shared";

const TRIGGERS: {
  value: TriggerType;
  icon: typeof BoltIcon;
  bg: string;
  fg: string;
  title: string;
  description: string;
}[] = [
  {
    value: "comment_keyword",
    icon: BoltIcon,
    bg: "var(--tint)",
    fg: "var(--primary)",
    title: "Comments on your Post or Reel",
    description: "Reply with a DM whenever someone comments your keyword.",
  },
  {
    value: "story_reply",
    icon: CameraIcon,
    bg: "var(--tint2)",
    fg: "var(--violet)",
    title: "Replies to your Story",
    description: "Reply with a DM whenever someone replies to your story.",
  },
  {
    value: "post_share",
    icon: ShareIcon,
    bg: "var(--success-tint)",
    fg: "var(--success-text)",
    title: "Shares your Post or Reel",
    description: "Reply with a DM whenever someone shares your post or reel to you.",
  },
  {
    value: "dm_keyword",
    icon: ChatIcon,
    bg: "var(--neutral-tint)",
    fg: "var(--ink)",
    title: "Sends you a DM",
    description: "Reply with a DM whenever someone messages you your keyword.",
  },
  {
    value: "live_comment",
    icon: VideoCameraIcon,
    bg: "var(--warning-tint)",
    fg: "var(--warning-text)",
    title: "Comments on your Live",
    description: "Reply with a DM whenever someone comments on your Live.",
  },
];

export function TriggerStep({
  value,
  onChange,
  locked = false,
}: {
  value: TriggerType;
  onChange: (triggerType: TriggerType) => void;
  /** Editing: the trigger can't change once the rule exists. */
  locked?: boolean;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
        Trigger AutoDM when someone…
      </legend>
      {locked && (
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          Can&apos;t be changed after creating — to use another trigger, create
          a new AutoDM.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2.5">
        {TRIGGERS.map((trigger) => {
          const active = trigger.value === value;

          return (
            <button
              key={trigger.value}
              type="button"
              aria-pressed={active}
              disabled={locked}
              onClick={() => onChange(trigger.value)}
              className={`${locked && !active ? "opacity-50" : ""} ${locked ? "cursor-not-allowed" : ""} flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-faint-bg)]`}
              style={
                active
                  ? { borderColor: "var(--primary)", backgroundColor: "var(--tint-faint)", boxShadow: "0 0 0 2px color-mix(in srgb, var(--primary) 15%, transparent)" }
                  : { borderColor: "var(--line)", backgroundColor: "#fff" }
              }
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: trigger.bg, color: trigger.fg }}
              >
                <trigger.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  {trigger.title}
                </span>
                <span className="mt-1 block text-xs" style={{ color: "var(--muted)" }}>
                  {trigger.description}
                </span>
              </span>
              {active && (
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: "var(--primary)" }}
                >
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
