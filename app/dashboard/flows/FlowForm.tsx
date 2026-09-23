"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Avatar } from "../components/Avatar";
import { SelectField, fieldClass } from "../components/controls";
import { primaryButtonClass, secondaryButtonClass } from "../components/styles";
import { PlusIcon, TrashIcon } from "../components/icons";
import type { FlowFormState, FlowStepInput } from "./actions";

const MESSAGE_MAX_LENGTH = 1000;

const DEFAULT_PUBLIC_REPLY_MESSAGE = "Got it! Check your inbox 📩";

const ATTACHMENT_TYPES = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
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

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId);

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
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5 dark:border-white/8 dark:bg-white/4"
    >
      <input type="hidden" name="steps" value={JSON.stringify(steps)} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
            className="mt-1 self-start text-xs font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
          >
            {manualEntry
              ? "Pick from your posts instead"
              : "Enter a media ID manually"}
          </button>
        </Field>
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
              Posts a public reply under the commenter&apos;s comment (e.g.
              &quot;Got it, check your inbox!&quot;) when the flow starts, in
              addition to step 1&apos;s DM.
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
              maxLength={MESSAGE_MAX_LENGTH}
              value={publicReplyMessage}
              onChange={(event) => setPublicReplyMessage(event.target.value)}
              placeholder="Got it! Check your inbox 📩"
              className={fieldClass}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Steps</h3>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add step
          </button>
        </div>

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
    </form>
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
        <span className="text-xs font-semibold text-zinc-500">Step {index + 1}</span>
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
          className="h-4 w-4 rounded border-black/20 text-indigo-600 focus:ring-indigo-500 dark:border-white/25"
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
              className="h-4 w-4 rounded border-black/20 text-indigo-600 focus:ring-indigo-500 dark:border-white/25"
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
                className="mt-0.5 h-4 w-4 rounded border-black/20 text-indigo-600 focus:ring-indigo-500 dark:border-white/25"
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
