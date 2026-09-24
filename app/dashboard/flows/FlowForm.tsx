"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Avatar } from "../components/Avatar";
import { SelectField, fieldClass } from "../components/controls";
import { primaryButtonClass, secondaryButtonClass } from "../components/styles";
import {
  ArrowLeftIcon,
  ChatIcon,
  InstagramIcon,
  PaperclipIcon,
  PhoneIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
  VideoCameraIcon,
} from "../components/icons";
import type { FlowFormState, FlowStepInput } from "./actions";

const MESSAGE_MAX_LENGTH = 1000;

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

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

const DEFAULT_PUBLIC_REPLY_MESSAGE = "Got it! Check your inbox 📩";

const ATTACHMENT_TYPES = [
  { value: "image", label: "Image" },
  // { value: "video", label: "Video" },
  // { value: "audio", label: "Audio" },
] as const;

export interface FlowFormAccountOption {
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

export interface FlowFormInitialValues {
  instagram_account_id: string;
  name: string;
  trigger_keyword: string;
  instagram_media_id: string | null;
  send_public_reply: boolean;
  public_reply_message: string | null;
  steps: FlowStepInput[];
}

function emptyStep(): FlowStepInput {
  return {
    step_order: 0,
    message_text: "",
    expects_reply: false,
    collects_email: false,
    intent_map: {},
    attachment_url: null,
    attachment_type: null,
    followup_enabled: false,
    followup_delay_hours: null,
    followup_message: null,
  };
}

export function FlowForm({
  accounts,
  action,
  initialValues,
  submitLabel,
}: {
  accounts: FlowFormAccountOption[];
  action: (state: FlowFormState, formData: FormData) => Promise<FlowFormState>;
  initialValues?: FlowFormInitialValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FlowFormState, FormData>(
    action,
    undefined
  );

  const [selectedAccountId, setSelectedAccountId] = useState(
    initialValues?.instagram_account_id ?? accounts[0]?.id ?? ""
  );
  const [triggerKeyword, setTriggerKeyword] = useState(
    initialValues?.trigger_keyword ?? ""
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
  const [sendPublicReply, setSendPublicReply] = useState(
    initialValues?.send_public_reply ?? false
  );
  const [publicReplyMessage, setPublicReplyMessage] = useState(
    initialValues?.public_reply_message ?? DEFAULT_PUBLIC_REPLY_MESSAGE
  );
  const [steps, setSteps] = useState<FlowStepInput[]>(
    initialValues?.steps?.length ? initialValues.steps : [emptyStep()]
  );
  const [previewTab, setPreviewTab] = useState<"dm" | "comment">("dm");
  const [previewStepIndex, setPreviewStepIndex] = useState(0);

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId);

  const settled = mediaResult?.accountId === selectedAccountId ? mediaResult : null;
  const visibleMediaOptions = settled?.items ?? [];
  const mediaError = settled?.error ?? null;
  const mediaLoading = Boolean(selectedAccountId) && settled === null;
  const selectedMedia = visibleMediaOptions.find(
    (item) => item.id === selectedMediaId
  );

  const clampedPreviewIndex = Math.min(previewStepIndex, steps.length - 1);
  const previewStep = steps[clampedPreviewIndex];

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

  function updateStep(index: number, patch: Partial<FlowStepInput>) {
    setSteps((current) =>
      current.map((step, i) => (i === index ? { ...step, ...patch } : step))
    );
  }

  function addStep() {
    setSteps((current) => [...current, emptyStep()]);
  }

  function removeStep(index: number) {
    setSteps((current) => current.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="steps" value={JSON.stringify(steps)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <StepCard
            number={1}
            title="Select Instagram account"
            description="Choose the account where this flow will be applied."
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

              <Field label="Flow name" htmlFor="name">
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={initialValues?.name}
                  placeholder="e.g. Pricing conversation"
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
                    ? "Paste the media ID of the post or reel this flow applies to."
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
                label="Trigger keyword"
                htmlFor="trigger_keyword"
                hint="Matched case-insensitively against the full, trimmed comment text — same as rules."
              >
                <input
                  id="trigger_keyword"
                  name="trigger_keyword"
                  required
                  value={triggerKeyword}
                  onChange={(event) => setTriggerKeyword(event.target.value)}
                  placeholder="e.g. PRICE"
                  className={fieldClass}
                />
              </Field>
            </div>
          </StepCard>

          <StepCard
            number={3}
            title="Flow steps"
            description="Define the sequence of DMs this flow sends, one at a time."
            aside={
              <button
                type="button"
                onClick={addStep}
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add step
              </button>
            }
          >
            <div className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <StepEditor
                  key={index}
                  index={index}
                  step={step}
                  stepCount={steps.length}
                  onChange={(patch) => updateStep(index, patch)}
                  onRemove={() => removeStep(index)}
                />
              ))}
            </div>
          </StepCard>

          <StepCard
            number={4}
            title="Additional settings"
            description="Customize how this flow works."
          >
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
                  maxLength={MESSAGE_MAX_LENGTH}
                  value={publicReplyMessage}
                  onChange={(event) => setPublicReplyMessage(event.target.value)}
                  placeholder="Got it! Check your inbox 📩"
                  className={fieldClass}
                />
              </div>
            )}
          </StepCard>

          {state?.error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <Link href="/dashboard/flows" className={secondaryButtonClass}>
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
                      {triggerKeyword || "KEYWORD"}
                    </p>
                  </div>

                  <div className="mt-2.5 flex flex-col items-end gap-1.5">
                    <div className="flex items-end gap-2">
                      <p className="brand-gradient max-w-[85%] min-w-0 rounded-2xl rounded-br-md px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-white">
                        {previewStep?.message_text
                          ? renderMessageWithLinks(previewStep.message_text)
                          : "This step's message will appear here..."}
                      </p>
                      <SendIcon className="mb-1 h-4 w-4 shrink-0 text-brand-400" />
                    </div>

                    {previewStep?.attachment_url && (
                      <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-br-md border border-black/10 bg-white px-2.5 py-2 dark:border-white/12 dark:bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL */}
                        <img
                          src={previewStep.attachment_url}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {attachmentFileName(previewStep.attachment_url)}
                          </p>
                          <p className="text-[10px] text-zinc-500">Image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {steps.length > 1 && (
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewStepIndex((i) => Math.max(0, i - 1))
                        }
                        disabled={clampedPreviewIndex === 0}
                        aria-label="Preview previous step"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/10"
                      >
                        ‹
                      </button>
                      <span className="text-[10px] font-medium text-zinc-500">
                        Step {clampedPreviewIndex + 1} of {steps.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewStepIndex((i) =>
                            Math.min(steps.length - 1, i + 1)
                          )
                        }
                        disabled={clampedPreviewIndex === steps.length - 1}
                        aria-label="Preview next step"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/10"
                      >
                        ›
                      </button>
                    </div>
                  )}

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
                      Any post — this flow matches comments on all posts.
                    </p>
                  )}

                  <div className="mt-3 flex items-start gap-2">
                    <Avatar name="user123" size="sm" muted />
                    <div className="min-w-0">
                      <p className="text-xs">
                        <span className="font-semibold">user123</span>{" "}
                        {triggerKeyword || "KEYWORD"}
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

function StepEditor({
  index,
  step,
  stepCount,
  onChange,
  onRemove,
}: {
  index: number;
  step: FlowStepInput;
  stepCount: number;
  onChange: (patch: Partial<FlowStepInput>) => void;
  onRemove: () => void;
}) {
  const otherSteps = Array.from({ length: stepCount }, (_, i) => i + 1).filter(
    (n) => n !== index + 1
  );

  return (
    <div className="rounded-xl border border-black/10 p-3.5 dark:border-white/12">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
            {index + 1}
          </span>
          Step {index + 1}
        </span>
        {stepCount > 1 && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove step ${index + 1}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <textarea
        required
        rows={3}
        maxLength={MESSAGE_MAX_LENGTH}
        value={step.message_text}
        onChange={(event) => onChange({ message_text: event.target.value })}
        placeholder="Message this step sends..."
        className={`${fieldClass} resize-y`}
      />

      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <div className="sm:w-28">
          <SelectField
            value={step.attachment_type ?? "image"}
            onChange={(event) =>
              onChange({ attachment_type: event.target.value as FlowStepInput["attachment_type"] })
            }
          >
            {ATTACHMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </SelectField>
        </div>
        <input
          value={step.attachment_url ?? ""}
          onChange={(event) => onChange({ attachment_url: event.target.value || null })}
          placeholder="Attachment URL (optional) — https://..."
          className={`${fieldClass} flex-1`}
        />
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={step.expects_reply}
          onChange={(event) => onChange({ expects_reply: event.target.checked })}
          className="h-4 w-4 rounded border-black/20 text-brand-600 focus:ring-brand-500 dark:border-white/25"
        />
        <span className="text-sm font-medium">
          Wait for a reply and branch to another step
        </span>
      </label>

      {step.expects_reply && (
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={step.collects_email}
              onChange={(event) => onChange({ collects_email: event.target.checked })}
              className="h-4 w-4 rounded border-black/20 text-brand-600 focus:ring-brand-500 dark:border-white/25"
            />
            <span className="text-sm font-medium">
              Collect the reply as an email address (skip yes/no branching)
            </span>
          </label>

          {step.collects_email ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <IntentTarget
                label="After a valid email is collected"
                value={step.intent_map.yes}
                options={otherSteps}
                onChange={(value) => onChange({ intent_map: { yes: value } })}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <IntentTarget
                label="If reply sounds like YES"
                value={step.intent_map.yes}
                options={otherSteps}
                onChange={(value) =>
                  onChange({ intent_map: { ...step.intent_map, yes: value } })
                }
              />
              <IntentTarget
                label="If reply sounds like NO"
                value={step.intent_map.no}
                options={otherSteps}
                onChange={(value) =>
                  onChange({ intent_map: { ...step.intent_map, no: value } })
                }
              />
              <IntentTarget
                label="Anything else (fallback)"
                value={step.intent_map.default}
                options={otherSteps}
                onChange={(value) =>
                  onChange({ intent_map: { ...step.intent_map, default: value } })
                }
              />
            </div>
          )}

          <div className="rounded-xl border border-black/10 px-3.5 py-3 dark:border-white/12">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={step.followup_enabled}
                onChange={(event) =>
                  onChange({ followup_enabled: event.target.checked })
                }
                className="mt-0.5 h-4 w-4 rounded border-black/20 text-brand-600 focus:ring-brand-500 dark:border-white/25"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Send a follow-up if there&apos;s no reply
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  A background sweep checks every 15 minutes and nudges
                  anyone who hasn&apos;t replied after the delay below. Sent
                  at most once per person for this step.
                </span>
              </span>
            </label>

            {step.followup_enabled && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor={`followup-delay-${index}`} className="text-sm font-medium">
                    Wait
                  </label>
                  <input
                    id={`followup-delay-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    value={step.followup_delay_hours ?? ""}
                    onChange={(event) =>
                      onChange({
                        followup_delay_hours: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                    className={`${fieldClass} w-24`}
                  />
                  <span className="text-sm text-zinc-500">hours, then send:</span>
                </div>
                <textarea
                  required={step.followup_enabled}
                  rows={2}
                  maxLength={MESSAGE_MAX_LENGTH}
                  value={step.followup_message ?? ""}
                  onChange={(event) =>
                    onChange({ followup_message: event.target.value })
                  }
                  placeholder="Still there? Reply and I'll pick up where we left off 👋"
                  className={`${fieldClass} resize-y`}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IntentTarget({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number | undefined;
  options: number[];
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-500">{label}</label>
      <SelectField
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : undefined)
        }
      >
        <option value="">End flow</option>
        {options.map((stepNumber) => (
          <option key={stepNumber} value={stepNumber}>
            Go to step {stepNumber}
          </option>
        ))}
      </SelectField>
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
