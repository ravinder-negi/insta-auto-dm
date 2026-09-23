"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Avatar } from "../components/Avatar";
import { SelectField, fieldClass } from "../components/controls";
import { primaryButtonClass, secondaryButtonClass } from "../components/styles";
import {
  EmojiIcon,
  InstagramIcon,
  SendIcon,
  UserIcon,
} from "../components/icons";
import type { RuleFormState } from "./actions";

const DM_MAX_LENGTH = 1000;

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const HAS_URL_PATTERN = /https?:\/\/[^\s]+/;

// Mirrors Instagram's own behavior: plain-text DMs auto-linkify bare URLs,
// so the preview should render them the same way instead of as flat text.
function renderMessageWithLinks(message: string) {
  const parts = message.split(URL_PATTERN);
  return parts.map((part, index) =>
    part.startsWith("http://") || part.startsWith("https://") ? (
      <span key={index} className="underline underline-offset-2">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

const QUICK_EMOJI = [
  "😀", "😍", "🔥", "🙌", "🎉", "✨", "👍", "🙏",
  "💜", "📩", "🚀", "💡", "✅", "👀", "💬", "🎁",
];

export interface RuleFormAccountOption {
  id: string;
  label: string;
  handle: string;
}

interface InstagramMediaOption {
  id: string;
  caption: string | null;
  media_type: string;
  thumbnail_url: string | null;
  permalink: string;
  timestamp: string;
}

function mediaOptionLabel(item: InstagramMediaOption) {
  const date = new Date(item.timestamp).toLocaleDateString("en-US");
  const caption = item.caption?.trim().slice(0, 60) || "(no caption)";
  return `${date} — ${item.media_type.toLowerCase()} — ${caption}`;
}

const DEFAULT_FOLLOW_PROMPT_MESSAGE =
  "Thanks for your comment! Follow {profile_link} first, then comment again and I'll send your link 🙌";

const DEFAULT_PUBLIC_REPLY_MESSAGE = "Got it! Check your inbox 📩";

const ATTACHMENT_TYPES = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
] as const;

export interface RuleFormInitialValues {
  instagram_account_id: string;
  name: string;
  keyword: string;
  instagram_media_id: string | null;
  dm_message: string;
  require_follow: boolean;
  follow_prompt_message: string | null;
  send_public_reply: boolean;
  public_reply_message: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
}

export function RuleForm({
  accounts,
  action,
  initialValues,
  submitLabel,
}: {
  accounts: RuleFormAccountOption[];
  action: (state: RuleFormState, formData: FormData) => Promise<RuleFormState>;
  initialValues?: RuleFormInitialValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RuleFormState, FormData>(
    action,
    undefined
  );

  const [selectedAccountId, setSelectedAccountId] = useState(
    initialValues?.instagram_account_id ?? accounts[0]?.id ?? ""
  );
  // One piece of state per fetch, tagged with the account it belongs to, so a
  // result for a previously selected account is never shown against a new one.
  const [mediaResult, setMediaResult] = useState<{
    accountId: string;
    items?: InstagramMediaOption[];
    error?: string;
  } | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState(
    initialValues?.instagram_media_id ?? ""
  );
  const [manualEntry, setManualEntry] = useState(false);
  const [keyword, setKeyword] = useState(initialValues?.keyword ?? "");
  const [dmMessage, setDmMessage] = useState(initialValues?.dm_message ?? "");
  const [requireFollow, setRequireFollow] = useState(
    initialValues?.require_follow ?? false
  );
  const [followPromptMessage, setFollowPromptMessage] = useState(
    initialValues?.follow_prompt_message ?? DEFAULT_FOLLOW_PROMPT_MESSAGE
  );
  const [sendPublicReply, setSendPublicReply] = useState(
    initialValues?.send_public_reply ?? false
  );
  const [publicReplyMessage, setPublicReplyMessage] = useState(
    initialValues?.public_reply_message ?? DEFAULT_PUBLIC_REPLY_MESSAGE
  );
  const [attachmentUrl, setAttachmentUrl] = useState(
    initialValues?.attachment_url ?? ""
  );
  const [attachmentType, setAttachmentType] = useState(
    initialValues?.attachment_type ?? "image"
  );
  const [emojiOpen, setEmojiOpen] = useState(false);
  const dmRef = useRef<HTMLTextAreaElement>(null);

  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId
  );

  const settled = mediaResult?.accountId === selectedAccountId ? mediaResult : null;
  const visibleMediaOptions = settled?.items ?? [];
  const mediaError = settled?.error ?? null;
  const mediaLoading = Boolean(selectedAccountId) && settled === null;
  const selectedMedia = visibleMediaOptions.find(
    (item) => item.id === selectedMediaId
  );

  useEffect(() => {
    if (!selectedAccountId) return;

    let cancelled = false;

    fetch(`/api/instagram/media?account_id=${encodeURIComponent(selectedAccountId)}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Failed to load posts");
        return body.items as InstagramMediaOption[];
      })
      .then((items) => {
        if (!cancelled) setMediaResult({ accountId: selectedAccountId, items });
      })
      .catch((err) => {
        if (!cancelled) {
          setMediaResult({
            accountId: selectedAccountId,
            error: err instanceof Error ? err.message : "Failed to load posts",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAccountId]);

  function insertEmoji(emoji: string) {
    const textarea = dmRef.current;
    const at = textarea?.selectionStart ?? dmMessage.length;
    const next = `${dmMessage.slice(0, at)}${emoji}${dmMessage.slice(at)}`.slice(
      0,
      DM_MAX_LENGTH
    );
    setDmMessage(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(at + emoji.length, at + emoji.length);
    });
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5 dark:border-white/8 dark:bg-white/4"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5">
          <Field label="Instagram account" htmlFor="instagram_account_id">
            <div className="relative">
              {selectedAccount && (
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                  <Avatar name={selectedAccount.handle} size="sm" />
                </span>
              )}
              <SelectField
                id="instagram_account_id"
                name="instagram_account_id"
                required
                value={selectedAccountId}
                onChange={(event) => setSelectedAccountId(event.target.value)}
                className={selectedAccount ? "[&>select]:pl-12" : ""}
              >
                <option value="" disabled>
                  Select an account
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.label}
                  </option>
                ))}
              </SelectField>
            </div>
          </Field>

          <Field label="Rule name" htmlFor="name">
            <input
              id="name"
              name="name"
              required
              defaultValue={initialValues?.name}
              placeholder="e.g. Send guide on pricing"
              className={fieldClass}
            />
          </Field>

          <Field
            label="Keyword"
            htmlFor="keyword"
            hint="Matched case-insensitively against the full, trimmed comment text."
          >
            <input
              id="keyword"
              name="keyword"
              required
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="e.g. GUIDE"
              className={fieldClass}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-5">
          <Field label="Post/reel (optional)" htmlFor="instagram_media_id">
            {manualEntry ? (
              <input
                id="instagram_media_id"
                name="instagram_media_id"
                value={selectedMediaId}
                onChange={(event) => setSelectedMediaId(event.target.value)}
                placeholder="Leave blank to match on any post"
                className={fieldClass}
              />
            ) : (
              <SelectField
                id="instagram_media_id"
                name="instagram_media_id"
                value={selectedMediaId}
                disabled={!selectedAccountId || mediaLoading}
                onChange={(event) => setSelectedMediaId(event.target.value)}
              >
                <option value="">Any post</option>
                {visibleMediaOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {mediaOptionLabel(item)}
                  </option>
                ))}
              </SelectField>
            )}

            <p className="mt-1.5 text-xs text-zinc-500">
              {manualEntry
                ? "Paste the media ID of the post or reel this rule applies to."
                : !selectedAccountId
                  ? "Select an Instagram account first to list its posts."
                  : mediaLoading
                    ? "Loading recent posts…"
                    : (mediaError ??
                      "Select a specific post/reel or keep as 'Any post'.")}
            </p>
            <button
              type="button"
              onClick={() => setManualEntry((value) => !value)}
              className="mt-1 self-start text-xs font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
            >
              {manualEntry
                ? "Pick from your posts instead"
                : "Enter a media ID manually"}
            </button>
          </Field>

          <Field label="DM message" htmlFor="dm_message">
            <div className="rounded-xl border border-black/10 transition-all duration-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-white/12">
              <textarea
                id="dm_message"
                name="dm_message"
                ref={dmRef}
                required
                rows={6}
                maxLength={DM_MAX_LENGTH}
                value={dmMessage}
                onChange={(event) => setDmMessage(event.target.value)}
                placeholder="Type your automated reply message..."
                className="w-full resize-y rounded-t-xl bg-transparent px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400"
              />
              <div className="relative flex items-center justify-between px-3 py-2">
                <button
                  type="button"
                  onClick={() => setEmojiOpen((value) => !value)}
                  aria-label="Insert emoji"
                  aria-expanded={emojiOpen}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10"
                >
                  <EmojiIcon className="h-4.5 w-4.5" />
                </button>
                <span className="text-xs text-zinc-400">
                  {dmMessage.length}/{DM_MAX_LENGTH}
                </span>

                {emojiOpen && (
                  <div className="animate-fade-in-up absolute bottom-10 left-0 z-20 grid w-56 grid-cols-8 gap-1 rounded-xl border border-black/6 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-zinc-900">
                    {QUICK_EMOJI.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="rounded-md py-1 text-base transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {HAS_URL_PATTERN.test(dmMessage) && (
              <p className="mt-1.5 text-xs text-zinc-500">
                Links are sent as plain text — Instagram automatically turns
                them into a tappable link for the recipient.
              </p>
            )}
          </Field>

          <div className="rounded-xl border border-black/10 px-3.5 py-3 dark:border-white/12">
            <span className="block text-sm font-semibold">Attachment (optional)</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              Sent as a second DM right after the message above — a real
              inline image/video/file, not just a link.
            </span>

            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
              <div className="sm:w-32">
                <SelectField
                  name="attachment_type"
                  value={attachmentType}
                  onChange={(event) => setAttachmentType(event.target.value)}
                >
                  {ATTACHMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </SelectField>
              </div>
              <input
                name="attachment_url"
                value={attachmentUrl}
                onChange={(event) => setAttachmentUrl(event.target.value)}
                placeholder="https://... (public URL)"
                className={`${fieldClass} flex-1`}
              />
            </div>
          </div>

          <div className="rounded-xl border border-black/10 px-3.5 py-3 dark:border-white/12">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                name="require_follow"
                checked={requireFollow}
                onChange={(event) => setRequireFollow(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-black/20 text-indigo-600 focus:ring-indigo-500 dark:border-white/25"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Require follow before sending DM
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  Commenters who don&apos;t follow the account yet get the
                  message below instead, asking them to follow. The real DM
                  message above is only sent once they follow.
                </span>
              </span>
            </label>

            {requireFollow && (
              <div className="mt-3">
                <label
                  htmlFor="follow_prompt_message"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Follow-prompt message
                </label>
                <textarea
                  id="follow_prompt_message"
                  name="follow_prompt_message"
                  required={requireFollow}
                  rows={4}
                  maxLength={DM_MAX_LENGTH}
                  value={followPromptMessage}
                  onChange={(event) => setFollowPromptMessage(event.target.value)}
                  placeholder="Ask them to follow before you send the real DM..."
                  className={fieldClass}
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  Use <code>{"{profile_link}"}</code> to insert a link to the
                  account&apos;s profile.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-black/10 px-3.5 py-3 dark:border-white/12">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                name="send_public_reply"
                checked={sendPublicReply}
                onChange={(event) => setSendPublicReply(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-black/20 text-indigo-600 focus:ring-indigo-500 dark:border-white/25"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Also reply on the comment
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  Posts a public reply under the commenter&apos;s comment
                  (e.g. &quot;Got it, check your inbox!&quot;) in addition to
                  the DM above.
                </span>
              </span>
            </label>

            {sendPublicReply && (
              <div className="mt-3">
                <label
                  htmlFor="public_reply_message"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Public reply message
                </label>
                <textarea
                  id="public_reply_message"
                  name="public_reply_message"
                  required={sendPublicReply}
                  rows={2}
                  maxLength={DM_MAX_LENGTH}
                  value={publicReplyMessage}
                  onChange={(event) => setPublicReplyMessage(event.target.value)}
                  placeholder="Got it! Check your inbox 📩"
                  className={fieldClass}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-black/6 bg-gradient-to-b from-indigo-50/60 to-white p-4 dark:border-white/8 dark:from-indigo-500/10 dark:to-transparent">
            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="ig-gradient flex h-5 w-5 items-center justify-center rounded text-white">
                <InstagramIcon className="h-3 w-3" />
              </span>
              Preview
            </p>

            {selectedMedia && (
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-black/5 bg-white p-3 dark:border-white/8 dark:bg-white/5">
                {selectedMedia.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedMedia.thumbnail_url}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                    <InstagramIcon className="h-7 w-7" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {selectedMedia.media_type.toLowerCase()} ·{" "}
                    {new Date(selectedMedia.timestamp).toLocaleDateString("en-US")}
                  </p>
                  <p className="mt-1 line-clamp-4 text-sm text-zinc-700 dark:text-zinc-300">
                    {selectedMedia.caption?.trim() || "(no caption)"}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-black/5 bg-white px-3 py-2.5 dark:border-white/8 dark:bg-white/5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                <UserIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold">user123</p>
                <p className="truncate text-xs text-zinc-500">
                  {keyword || "KEYWORD"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-end gap-2">
              <p className="brand-gradient min-w-0 flex-1 rounded-2xl rounded-br-md px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-white">
                {dmMessage
                  ? renderMessageWithLinks(dmMessage)
                  : "Your automated reply will appear here..."}
              </p>
              <SendIcon className="mb-1 h-4 w-4 shrink-0 text-indigo-400" />
            </div>

            {attachmentUrl && attachmentType === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachmentUrl}
                alt=""
                className="mt-2 h-32 w-32 rounded-2xl rounded-br-md object-cover"
              />
            )}
            {attachmentUrl && attachmentType !== "image" && (
              <p className="mt-2 w-fit rounded-2xl rounded-br-md border border-black/10 px-3.5 py-2.5 text-xs text-zinc-500 dark:border-white/12">
                📎 {attachmentType} attachment
              </p>
            )}
          </div>

          {state?.error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 lg:mt-auto">
            <Link
              href="/dashboard/rules"
              className={secondaryButtonClass}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className={primaryButtonClass}
            >
              {pending ? "Saving…" : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={htmlFor} className="mb-1.5 text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
