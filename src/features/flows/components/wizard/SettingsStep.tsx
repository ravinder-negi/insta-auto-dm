"use client";

import { fieldClass } from "@/components/ui/controls";
import { MESSAGE_MAX_LENGTH } from "./shared";

export function SettingsStep({
  sendPublicReply,
  onSendPublicReplyChange,
  publicReplyMessage,
  onPublicReplyMessageChange,
}: {
  sendPublicReply: boolean;
  onSendPublicReplyChange: (value: boolean) => void;
  publicReplyMessage: string;
  onPublicReplyMessageChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Also reply on the comment</p>
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
        <div>
          <label htmlFor="public_reply_message" className="mb-1.5 block text-sm font-semibold">
            Public reply message
          </label>
          <textarea
            id="public_reply_message"
            required={sendPublicReply}
            rows={2}
            maxLength={MESSAGE_MAX_LENGTH}
            value={publicReplyMessage}
            onChange={(event) => onPublicReplyMessageChange(event.target.value)}
            placeholder="Got it! Check your inbox 📩"
            className={fieldClass}
          />
        </div>
      )}
    </div>
  );
}
