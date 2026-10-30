"use client";

import { SelectField, fieldClass } from "@/components/ui/controls";
import {
  ChatIcon,
  CloseIcon,
  InfoIcon,
  PaperclipIcon,
  PlusIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/icons";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { FlowStepInput } from "@/features/flows/actions";
import {
  ATTACHMENT_SIZE_LIMITS,
  ATTACHMENT_TYPES,
  BUTTON_LABEL_MAX_LENGTH,
  CARD_TITLE_MAX_LENGTH,
  MAX_BUTTONS,
  MESSAGE_MAX_LENGTH,
  emptyStep,
} from "./shared";

export function StepsStep({
  steps,
  onChange,
}: {
  steps: FlowStepInput[];
  onChange: (steps: FlowStepInput[]) => void;
}) {
  function updateStep(index: number, patch: Partial<FlowStepInput>) {
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }

  function addStep() {
    onChange([...steps, emptyStep()]);
  }

  function removeStep(index: number) {
    onChange(steps.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
          Define the sequence of DMs this flow sends, one at a time.
          <FlowHelpPopover onUseExample={() => onChange(EXAMPLE_FLOW)} />
        </p>
        <button
          type="button"
          onClick={addStep}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold hover:underline"
          style={{ color: "var(--primary)" }}
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

  function updateButton(buttonIndex: number, patch: Partial<FlowStepInput["buttons"][number]>) {
    onChange({
      buttons: step.buttons.map((button, i) =>
        i === buttonIndex ? { ...button, ...patch } : button
      ),
    });
  }

  // One DM can carry buttons OR a single attachment, never both — an
  // explicit, exclusive choice instead of letting both be filled in
  // silently. Derived straight from the step's own data, same rule the
  // edge function enforces when sending.
  // attachment_type (not just the URL) marks "attachment" mode — otherwise
  // picking it before typing a URL would have nothing to key the choice on
  // and the UI would snap straight back to "No extra".
  const contentType: "none" | "buttons" | "attachment" = step.buttons.length
    ? "buttons"
    : step.attachment_url || step.attachment_type
      ? "attachment"
      : "none";

  function selectContentType(type: "none" | "buttons" | "attachment") {
    if (type === "buttons") {
      onChange({
        attachment_url: null,
        attachment_type: null,
        buttons: step.buttons.length ? step.buttons : [{ label: "", url: "" }],
      });
      return;
    }

    onChange({
      buttons: [],
      button_card_title: "",
      ...(type === "attachment"
        ? { attachment_type: step.attachment_type ?? "image" }
        : { attachment_url: null, attachment_type: null }),
    });
  }

  // "What happens next" collapses the old stack of checkboxes (wait / collect
  // email / numbered options) into one exclusive choice, derived straight
  // from the step's data so it stays in sync on edit.
  const nextMode: NextMode = !step.expects_reply
    ? "end"
    : step.collects_email
      ? "email"
      : step.options.length > 0
        ? "options"
        : "branch";

  function selectNextMode(mode: NextMode) {
    if (mode === "end") {
      onChange({ expects_reply: false });
      return;
    }
    if (mode === "branch") {
      onChange({ expects_reply: true, collects_email: false, options: [] });
      return;
    }
    if (mode === "options") {
      onChange({
        expects_reply: true,
        collects_email: false,
        options: step.options.length
          ? step.options
          : [{ label: "", target_step_order: null }],
      });
      return;
    }
    onChange({ expects_reply: true, collects_email: true, options: [] });
  }

  // Shared across every "wait for a reply" mode — the no-reply nudge.
  const followupBox = (
    <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "var(--line)" }}>
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={step.followup_enabled}
          onChange={(event) => onChange({ followup_enabled: event.target.checked })}
          className="mt-0.5 h-4 w-4 rounded accent-[var(--primary)]"
        />
        <span>
          <span className="block text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Send a follow-up if there&apos;s no reply
          </span>
          <span className="mt-0.5 block text-xs" style={{ color: "var(--muted)" }}>
            A background sweep checks every 15 minutes and nudges anyone who
            hasn&apos;t replied after the delay below. Sent at most once per
            person for this step.
          </span>
        </span>
      </label>

      {step.followup_enabled && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor={`followup-delay-${index}`} className="text-sm font-medium" style={{ color: "var(--ink)" }}>
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
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              hours, then send:
            </span>
          </div>
          <textarea
            required={step.followup_enabled}
            rows={2}
            maxLength={MESSAGE_MAX_LENGTH}
            value={step.followup_message ?? ""}
            onChange={(event) => onChange({ followup_message: event.target.value })}
            placeholder="Still there? Reply and I'll pick up where we left off 👋"
            className={`${fieldClass} resize-y`}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border p-3.5" style={{ borderColor: "var(--line)" }}>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--muted)" }}>
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ backgroundColor: "var(--neutral-tint)", color: "var(--neutral-text)" }}
          >
            {index + 1}
          </span>
          Step {index + 1}
        </span>
        {stepCount > 1 && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove step ${index + 1}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--danger-tint)]"
            style={{ color: "var(--danger-strong)" }}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <SectionHeader icon={ChatIcon} title="Write the message" hint="The DM this step sends." />
      <textarea
        required
        rows={3}
        maxLength={MESSAGE_MAX_LENGTH}
        value={step.message_text}
        onChange={(event) => onChange({ message_text: event.target.value })}
        placeholder="Message this step sends..."
        className={`${fieldClass} resize-y`}
      />

      <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <SectionHeader
          icon={PaperclipIcon}
          title="Add buttons or an attachment"
          hint="Optional — one or the other, never both."
        />
      </div>
      <div className="inline-flex rounded-full border p-0.5" style={{ borderColor: "var(--line)" }}>
        {(
          [
            { value: "none", label: "No extra" },
            { value: "buttons", label: "Buttons" },
            { value: "attachment", label: "Attachment" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectContentType(option.value)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
            style={
              contentType === option.value
                ? { backgroundColor: "var(--primary)", color: "#fff" }
                : { color: "var(--muted)" }
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {contentType === "attachment" && (
        <>
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
            <div className="sm:w-36">
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
              placeholder="Attachment URL — https://..."
              className={`${fieldClass} flex-1`}
            />
          </div>
          {step.attachment_url && (
            <p className="mt-1.5 text-xs" style={{ color: "var(--muted-soft)" }}>
              {
                ATTACHMENT_SIZE_LIMITS[
                  (step.attachment_type ?? "image") as keyof typeof ATTACHMENT_SIZE_LIMITS
                ]
              }
            </p>
          )}
        </>
      )}

      {contentType === "buttons" && (
      <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col">
              <label
                htmlFor={`step-card-title-${index}`}
                className="mb-1.5 text-sm font-semibold"
                style={{ color: "var(--ink)" }}
              >
                Card heading for long messages
              </label>
              <input
                id={`step-card-title-${index}`}
                value={step.button_card_title ?? ""}
                onChange={(event) => onChange({ button_card_title: event.target.value })}
                maxLength={CARD_TITLE_MAX_LENGTH}
                placeholder="Tap the button below 👇"
                className={fieldClass}
              />
            </div>

          {step.buttons.map((button, buttonIndex) => (
            <div key={buttonIndex} className="rounded-xl border p-3.5" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  Button #{buttonIndex + 1}
                </p>
                <button
                  type="button"
                  aria-label={`Remove button ${buttonIndex + 1}`}
                  onClick={() =>
                    onChange({
                      buttons: step.buttons.filter((_, i) => i !== buttonIndex),
                    })
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--danger-tint)] hover:text-[var(--danger-strong)]"
                  style={{ color: "var(--muted-soft)" }}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <input
                value={button.label}
                onChange={(event) => updateButton(buttonIndex, { label: event.target.value })}
                maxLength={BUTTON_LABEL_MAX_LENGTH}
                placeholder="Click me"
                aria-label={`Button ${buttonIndex + 1} label`}
                className={`${fieldClass} mt-2`}
              />
              <p className="mt-3 mb-1.5 text-sm font-semibold" style={{ color: "var(--ink)" }}>
                When someone taps this button, open…
              </p>
              <input
                value={button.url}
                onChange={(event) => updateButton(buttonIndex, { url: event.target.value })}
                placeholder="https://your-link.com"
                aria-label={`Button ${buttonIndex + 1} link`}
                className={fieldClass}
              />
            </div>
          ))}

          {step.buttons.length < MAX_BUTTONS && (
            <button
              type="button"
              onClick={() =>
                onChange({ buttons: [...step.buttons, { label: "", url: "" }] })
              }
              className="inline-flex w-fit items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/4"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <PlusIcon className="h-4 w-4" />
              Add {step.buttons.length > 0 ? "another " : "a "}button
            </button>
          )}
      </div>
      )}

      <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <SectionHeader
          icon={ShareIcon}
          title="What happens next"
          hint="Choose how the flow continues after this message."
        />
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {NEXT_MODES.map((mode) => {
          const active = nextMode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => selectNextMode(mode.value)}
              className="flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors"
              style={
                active
                  ? { borderColor: "var(--primary)", backgroundColor: "var(--tint-faint)" }
                  : { borderColor: "var(--line)", backgroundColor: "#fff" }
              }
            >
              <span
                className="text-sm font-semibold"
                style={{ color: active ? "var(--primary)" : "var(--ink)" }}
              >
                {mode.label}
              </span>
              <span className="text-[11px] leading-tight" style={{ color: "var(--muted)" }}>
                {mode.hint}
              </span>
            </button>
          );
        })}
      </div>

      {nextMode === "end" && (
        <p className="mt-3 rounded-xl px-3.5 py-3 text-xs" style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>
          The flow stops here. The person gets this message and nothing more
          — unless another step points back to this one.
        </p>
      )}

      {nextMode === "branch" && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            We read their reply and send them to a step based on what they
            say.
          </p>
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
          {followupBox}
        </div>
      )}

      {nextMode === "options" && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            The numbered list is added to your message automatically. A reply
            matches by number, or by typing the option&apos;s label.
          </p>
          <div className="flex flex-col gap-2">
            {step.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <span className="flex h-9 w-6 shrink-0 items-center justify-center text-xs font-semibold" style={{ color: "var(--muted-soft)" }}>
                  {optionIndex + 1}
                </span>
                <input
                  value={option.label}
                  onChange={(event) =>
                    onChange({
                      options: step.options.map((o, i) =>
                        i === optionIndex ? { ...o, label: event.target.value } : o
                      ),
                    })
                  }
                  placeholder="Option label, e.g. Pro"
                  className={`${fieldClass} flex-1`}
                />
                <div className="w-36 shrink-0">
                  <IntentTarget
                    label=""
                    value={option.target_step_order ?? undefined}
                    options={otherSteps}
                    onChange={(value) =>
                      onChange({
                        options: step.options.map((o, i) =>
                          i === optionIndex
                            ? { ...o, target_step_order: value ?? null }
                            : o
                        ),
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      options: step.options.filter((_, i) => i !== optionIndex),
                    })
                  }
                  aria-label={`Remove option ${optionIndex + 1}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--danger-tint)]"
                  style={{ color: "var(--danger-strong)" }}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange({
                  options: [...step.options, { label: "", target_step_order: null }],
                })
              }
              className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold hover:underline"
              style={{ color: "var(--primary)" }}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add option
            </button>
          </div>
          {followupBox}
        </div>
      )}

      {nextMode === "email" && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            The reply is saved as a lead. Invalid replies are re-prompted
            automatically.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <IntentTarget
              label="After a valid email is collected"
              value={step.intent_map.yes}
              options={otherSteps}
              onChange={(value) => onChange({ intent_map: { yes: value } })}
            />
          </div>
          {followupBox}
        </div>
      )}
    </div>
  );
}

type NextMode = "end" | "branch" | "options" | "email";

const NEXT_MODES: { value: NextMode; label: string; hint: string }[] = [
  { value: "end", label: "End here", hint: "No reply needed" },
  { value: "branch", label: "Wait & branch", hint: "Route by yes / no" },
  { value: "options", label: "Ask options", hint: "Numbered choices" },
  { value: "email", label: "Collect email", hint: "Save as a lead" },
];

/** The guide-or-demo flow shown in the help diagram, ready to drop into the
 *  builder. Options target 1-based step numbers, matching IntentTarget. */
const EXAMPLE_FLOW: FlowStepInput[] = [
  {
    ...emptyStep(),
    message_text:
      "Hey! 👋 Thanks for your interest. Are you looking for our free guide, or a demo?",
    expects_reply: true,
    options: [
      { label: "Free guide", target_step_order: 2 },
      { label: "Demo", target_step_order: 3 },
    ],
  },
  {
    ...emptyStep(),
    message_text: "Awesome — here's the free guide. Grab it below 👇",
    button_card_title: "Tap the button below 👇",
    buttons: [{ label: "Download guide", url: "https://your-link.com/guide" }],
  },
  {
    ...emptyStep(),
    message_text: "Great! Drop your email and we'll send a demo link.",
    expects_reply: true,
    collects_email: true,
  },
];

/** Info icon by the intro line; on click it opens a modal with a visual
 *  branching-flow diagram, so a first-time builder sees the shape, not just a
 *  wall of text. */
function FlowHelpPopover({ onUseExample }: { onUseExample: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="How to build a flow"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:text-[var(--primary)]"
        style={{ color: "var(--muted-soft)" }}
      >
        <InfoIcon className="h-4 w-4" />
      </button>

      {open && (
        <FlowHelpModal
          onClose={() => setOpen(false)}
          onUseExample={() => {
            onUseExample();
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

const CONNECTOR = "#CFC6F5";

function FlowHelpModal({
  onClose,
  onUseExample,
}: {
  onClose: () => void;
  onUseExample: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(21,19,28,0.5)] backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="How flows work"
        className="animate-fade-in-up relative flex max-h-[90vh] w-full max-w-[460px] flex-col overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_50px_90px_-30px_rgba(21,19,28,0.6)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--ink)" }}>
              How a flow works
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              A flow is a chain of DMs. Each step sends one message; its reply
              decides which step comes next.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-black/4"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <span
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: "var(--neutral-tint)", color: "var(--neutral-text)" }}
          >
            💬 Someone comments your keyword
          </span>
          <Connector />

          <DiagramNode n={1} title="“Guide or demo?”" tag="Ask options" />

          {/* Split: step 1's reply branches to two steps. */}
          <div className="relative grid w-full grid-cols-2">
            <BranchArm side="left" label="Taps “Free guide”">
              <DiagramNode n={2} title="Send the guide" tag="Button · Ends" />
            </BranchArm>
            <BranchArm side="right" label="Taps “Demo”">
              <DiagramNode n={3} title="Ask for their email" tag="Collect email · Ends" />
            </BranchArm>
          </div>
        </div>

        <div
          className="mt-6 rounded-2xl p-4 text-xs leading-relaxed"
          style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}
        >
          <span className="font-semibold" style={{ color: "var(--ink)" }}>
            To build this:
          </span>{" "}
          On step 1, set <b>What happens next → Ask options</b> and point each
          option at a step. Give steps 2 and 3 their message, then set them to{" "}
          <b>End here</b>.
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onUseExample}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Use this example
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border px-6 text-sm font-semibold"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            Close
          </button>
        </div>
        <p className="mt-2 text-center text-[11px]" style={{ color: "var(--muted-soft)" }}>
          Replaces your current steps — edit the text and link after.
        </p>
      </div>
    </div>,
    document.body
  );
}

/** A short vertical line between diagram nodes. */
function Connector() {
  return <span className="h-5 w-0.5" style={{ backgroundColor: CONNECTOR }} />;
}

/** One side of step 1's branch: the elbow line down to a child node, plus the
 *  label on the edge that leads there. */
function BranchArm({
  side,
  label,
  children,
}: {
  side: "left" | "right";
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center px-1.5 pt-5">
      {/* Vertical drop into this child. */}
      <span
        className="absolute top-0 left-1/2 h-5 w-0.5 -translate-x-1/2"
        style={{ backgroundColor: CONNECTOR }}
      />
      {/* Horizontal bar: inner half only, so the two arms meet at the centre. */}
      <span
        className={`absolute top-0 h-0.5 ${side === "left" ? "left-1/2 right-0" : "left-0 right-1/2"}`}
        style={{ backgroundColor: CONNECTOR }}
      />
      <span
        className="mb-2 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ backgroundColor: "var(--tint2)", color: "var(--violet)" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function DiagramNode({
  n,
  title,
  tag,
}: {
  n: number;
  title: string;
  tag: string;
}) {
  return (
    <div
      className="flex w-full items-start gap-2.5 rounded-2xl border bg-white p-3"
      style={{ borderColor: "var(--line)" }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
        style={{ backgroundColor: "var(--tint)", color: "var(--primary)" }}
      >
        {n}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {title}
        </span>
        <span
          className="w-fit rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: "var(--neutral-tint)", color: "var(--neutral-text)" }}
        >
          {tag}
        </span>
      </span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-2">
      <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--ink)" }}>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--tint)", color: "var(--primary)" }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        {title}
      </span>
      {hint && (
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
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
      <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}
      </label>
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
