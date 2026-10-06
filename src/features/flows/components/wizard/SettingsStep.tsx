"use client";

import { fieldClass } from "@/components/ui/controls";
import { PUBLIC_REPLY_MAX_LENGTH, PUBLIC_REPLY_SLOTS } from "./shared";

export function SettingsStep({
  sendPublicReply,
  onSendPublicReplyChange,
  publicReplyMessages,
  onPublicReplyMessagesChange,
}: {
  sendPublicReply: boolean;
  onSendPublicReplyChange: (value: boolean) => void;
  publicReplyMessages: string[];
  onPublicReplyMessagesChange: (values: string[]) => void;
}) {
  function setReplyAt(index: number, message: string) {
    const next = Array.from(
      { length: PUBLIC_REPLY_SLOTS },
      (_, slot) => publicReplyMessages[slot] ?? ""
    );
    next[index] = message.slice(0, PUBLIC_REPLY_MAX_LENGTH);
    onPublicReplyMessagesChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Auto-Reply to comments on the post</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Posts a public reply under the commenter&apos;s comment (e.g.
            &quot;Got it, check your inbox!&quot;) when the flow starts, in
            addition to step 1&apos;s DM.
          </p>
        </div>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={sendPublicReply}
            onChange={(event) => onSendPublicReplyChange(event.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-brand-600 dark:bg-zinc-700" />
          <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {sendPublicReply && (
        <div className="flex flex-col gap-3.5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Write up to {PUBLIC_REPLY_SLOTS} replies — one is picked at random
            per comment so your replies don&apos;t look like a bot. Automating
            comment replies carries risk; keep them varied and human.
          </p>

          {Array.from({ length: PUBLIC_REPLY_SLOTS }).map((_, index) => {
            const value = publicReplyMessages[index] ?? "";

            return (
              <div key={index} className="flex flex-col">
                <label
                  htmlFor={`public_reply_${index}`}
                  className="mb-1.5 text-sm font-semibold"
                >
                  Comment response {index + 1}
                  {index === 0 && (
                    <span className="text-rose-500" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id={`public_reply_${index}`}
                    value={value}
                    onChange={(event) => setReplyAt(index, event.target.value)}
                    maxLength={PUBLIC_REPLY_MAX_LENGTH}
                    placeholder="Thanks! Please see DMs."
                    className={`${fieldClass} pr-16`}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-zinc-400">
                    {value.length}/{PUBLIC_REPLY_MAX_LENGTH}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
