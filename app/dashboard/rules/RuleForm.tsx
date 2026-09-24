"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Avatar } from "../components/Avatar";
import { SelectField, fieldClass } from "../components/controls";
import { primaryButtonClass, secondaryButtonClass } from "../components/styles";
import {
  ArrowLeftIcon,
  ChatIcon,
  EmojiIcon,
  InstagramIcon,
  PaperclipIcon,
  PhoneIcon,
  SendIcon,
  VideoCameraIcon,
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

function attachmentFileName(url: string) {
  try {
    const name = new URL(url).pathname.split("/").pop();
    return name ? decodeURIComponent(name) : "attachment";
  } catch {
    return "attachment";
  }
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
  // { value: "video", label: "Video" },
  // { value: "audio", label: "Audio" },
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
  const [previewTab, setPreviewTab] = useState<"dm" | "comment">("dm");

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
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <StepCard
            number={1}
            title="Select Instagram account"
            description="Choose the account where this rule will be applied."
            aside={
              <Link
                href="/dashboard/accounts"
                className="shrink-0 text-xs font-semibold text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
              >
                Need to connect an account?
              </Link>
            }
          >
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
            </div>
          </StepCard>

          <StepCard
            number={2}
            title="Trigger"
            description="Define when this automation should run."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Post / Reel" htmlFor="instagram_media_id">
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
                  className="mt-1 self-start text-xs font-semibold text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                >
                  {manualEntry
                    ? "Pick from your posts instead"
                    : "Enter a media ID manually"}
                </button>

                {selectedMedia && (
                  <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-black/8 bg-zinc-50 p-2.5 dark:border-white/10 dark:bg-white/5">
                    {selectedMedia.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedMedia.thumbnail_url}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                        <InstagramIcon className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {selectedMedia.media_type.toLowerCase()} ·{" "}
                        {new Date(selectedMedia.timestamp).toLocaleDateString("en-US")}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-700 dark:text-zinc-300">
                        {selectedMedia.caption?.trim() || "(no caption)"}
                      </p>
                    </div>
                  </div>
                )}
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
          </StepCard>

          <StepCard
            number={3}
            title="Reply message"
            description="This message will be sent as a DM when someone comments with the keyword."
          >
            <div className="rounded-xl border border-black/10 transition-all duration-200 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-white/12">
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
          </StepCard>

          <StepCard
            number={4}
            title="Add attachment (optional)"
            description="Send an image along with the DM."
          >
            <p className="text-xs text-zinc-500">
              Sent as a second DM right after the message above — a real
              inline image, not just a link.
            </p>

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
          </StepCard>

          <StepCard
            number={5}
            title="Additional settings"
            description="Customize how this rule works."
          >
            <div className="flex flex-col gap-3.5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Require follow before sending DM
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Commenters who don&apos;t follow the account yet get the
                      message below instead, asking them to follow. The real DM
                      message above is only sent once they follow.
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="require_follow"
                      checked={requireFollow}
                      onChange={(event) => setRequireFollow(event.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-brand-600 dark:bg-zinc-700" />
                    <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                  </label>
                </div>

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

              <div className="border-t border-black/8 pt-3.5 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Also reply on the comment
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Posts a public reply under the commenter&apos;s comment
                      (e.g. &quot;Got it, check your inbox!&quot;) in addition to
                      the DM above.
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="send_public_reply"
                      checked={sendPublicReply}
                      onChange={(event) => setSendPublicReply(event.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-brand-600 dark:bg-zinc-700" />
                    <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                  </label>
                </div>

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
          </StepCard>

          {state?.error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <Link href="/dashboard/rules" className={secondaryButtonClass}>
              Cancel
            </Link>
            <button type="submit" disabled={pending} className={primaryButtonClass}>
              {pending ? "Saving…" : submitLabel}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
            <p className="text-sm font-semibold">Live preview</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              This is how the user will experience it.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/8">
              <button
                type="button"
                onClick={() => setPreviewTab("dm")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  previewTab === "dm"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <SendIcon className="h-3.5 w-3.5" />
                DM Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("comment")}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  previewTab === "comment"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <ChatIcon className="h-3.5 w-3.5" />
                Comment Preview
              </button>
            </div>

            <div className="mt-3 rounded-2xl border border-black/8 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/3">
              {previewTab === "dm" ? (
                <>
                  <div className="flex items-center gap-2">
                    <ArrowLeftIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                    <Avatar name="user123" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">user123</p>
                      <p className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active now
                      </p>
                    </div>
                    <PhoneIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                    <VideoCameraIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                  </div>

                  <p className="my-3 text-center text-[10px] text-zinc-400">
                    Today {new Date().toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>

                  <div className="flex items-end gap-2">
                    <Avatar name="user123" size="sm" muted />
                    <p className="rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-2 text-xs dark:bg-white/10">
                      {keyword || "KEYWORD"}
                    </p>
                  </div>

                  <div className="mt-2.5 flex flex-col items-end gap-1.5">
                    <div className="flex items-end gap-2">
                      <p className="brand-gradient max-w-[85%] min-w-0 rounded-2xl rounded-br-md px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-white">
                        {dmMessage
                          ? renderMessageWithLinks(dmMessage)
                          : "Your automated reply will appear here..."}
                      </p>
                      <SendIcon className="mb-1 h-4 w-4 shrink-0 text-brand-400" />
                    </div>

                    {attachmentUrl && (
                      <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-br-md border border-black/10 bg-white px-2.5 py-2 dark:border-white/12 dark:bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL */}
                        <img
                          src={attachmentUrl}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {attachmentFileName(attachmentUrl)}
                          </p>
                          <p className="text-[10px] text-zinc-500">Image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-full border border-black/10 bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-white/5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                      <InstagramIcon className="h-3 w-3" />
                    </span>
                    <span className="flex-1 text-xs text-zinc-400">Message...</span>
                    <PaperclipIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                  </div>
                </>
              ) : (
                <>
                  {selectedMedia ? (
                    <div className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-3 dark:border-white/8 dark:bg-white/5">
                      {selectedMedia.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedMedia.thumbnail_url}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                          <InstagramIcon className="h-6 w-6" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          {selectedMedia.media_type.toLowerCase()} ·{" "}
                          {new Date(selectedMedia.timestamp).toLocaleDateString("en-US")}
                        </p>
                        <p className="mt-1 line-clamp-3 text-xs text-zinc-700 dark:text-zinc-300">
                          {selectedMedia.caption?.trim() || "(no caption)"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-black/10 bg-white px-3 py-2.5 text-xs text-zinc-400 dark:border-white/10 dark:bg-white/5">
                      Any post — this rule matches comments on all posts.
                    </p>
                  )}

                  <div className="mt-3 flex items-start gap-2">
                    <Avatar name="user123" size="sm" muted />
                    <div className="min-w-0">
                      <p className="text-xs">
                        <span className="font-semibold">user123</span>{" "}
                        {keyword || "KEYWORD"}
                      </p>

                      {sendPublicReply && (
                        <div className="mt-2 flex items-start gap-2">
                          <Avatar
                            name={selectedAccount?.handle ?? "you"}
                            size="sm"
                          />
                          <p className="text-xs">
                            <span className="font-semibold">
                              {selectedAccount?.handle ?? "you"}
                            </span>{" "}
                            {publicReplyMessage || DEFAULT_PUBLIC_REPLY_MESSAGE}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function StepCard({
  number,
  title,
  description,
  aside,
  children,
}: {
  number: number;
  title: string;
  description: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5 dark:border-white/8 dark:bg-white/4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="brand-gradient mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
            {number}
          </span>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          </div>
        </div>
        {aside}
      </div>
      <div className="mt-4 pl-10">{children}</div>
    </div>
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
