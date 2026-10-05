"use client";

import { SelectField, fieldClass } from "@/components/ui/controls";
import { PlusIcon, TrashIcon } from "@/components/icons";
import type { FlowStepInput } from "@/features/flows/actions";
import { ATTACHMENT_TYPES, MESSAGE_MAX_LENGTH, emptyStep } from "./shared";

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
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Define the sequence of DMs this flow sends, one at a time.
        </p>
        <button
          type="button"
          onClick={addStep}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
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
            <>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={step.options.length > 0}
                  onChange={(event) =>
                    onChange({
                      options: event.target.checked
                        ? [{ label: "", target_step_order: null }]
                        : [],
                    })
                  }
                  className="h-4 w-4 rounded border-black/20 text-brand-600 focus:ring-brand-500 dark:border-white/25"
                />
                <span className="text-sm font-medium">
                  Offer numbered options instead of yes/no
                </span>
              </label>

              {step.options.length > 0 ? (
                <p className="-mt-1.5 text-xs text-zinc-500">
                  Numbered list is added to the message automatically. A
                  reply matches by number, or by typing the option&apos;s
                  label.
                </p>
              ) : null}

              {step.options.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {step.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <span className="flex h-9 w-6 shrink-0 items-center justify-center text-xs font-semibold text-zinc-400">
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
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15"
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
                    className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add option
                  </button>
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
            </>
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
