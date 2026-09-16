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
  permalink: string;
  timestamp: string;
}

function mediaOptionLabel(item: InstagramMediaOption) {
  const date = new Date(item.timestamp).toLocaleDateString("en-US");
  const caption = item.caption?.trim().slice(0, 60) || "(no caption)";
  return `${date} — ${item.media_type.toLowerCase()} — ${caption}`;
}

export interface RuleFormInitialValues {
  instagram_account_id: string;
  name: string;
  keyword: string;
  instagram_media_id: string | null;
  dm_message: string;
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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const dmRef = useRef<HTMLTextAreaElement>(null);

  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId
  );

  const settled = mediaResult?.accountId === selectedAccountId ? mediaResult : null;
  const visibleMediaOptions = settled?.items ?? [];
  const mediaError = settled?.error ?? null;
  const mediaLoading = Boolean(selectedAccountId) && settled === null;

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
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-black/6 bg-gradient-to-b from-indigo-50/60 to-white p-4 dark:border-white/8 dark:from-indigo-500/10 dark:to-transparent">
            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="ig-gradient flex h-5 w-5 items-center justify-center rounded text-white">
                <InstagramIcon className="h-3 w-3" />
              </span>
              Preview
            </p>

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
                {dmMessage || "Your automated reply will appear here..."}
              </p>
              <SendIcon className="mb-1 h-4 w-4 shrink-0 text-indigo-400" />
            </div>
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
