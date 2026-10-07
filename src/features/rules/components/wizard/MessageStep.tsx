"use client";

import { useRef, useState } from "react";
import { SelectField, fieldClass } from "@/components/ui/controls";
import {
  ClockIcon,
  EmojiIcon,
  MailIcon,
  PlusIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
} from "@/components/icons";
import {
  BUTTON_LABEL_MAX_LENGTH,
  CARD_SUBTITLE_MAX_LENGTH,
  CARD_TITLE_MAX_LENGTH,
  DELAY_UNITS,
  DM_MAX_LENGTH,
  FOLLOWUP_UNITS,
  MAX_BUTTONS,
  MAX_FOLLOWUPS,
  type RuleFollowupValue,
  type RuleWizardValues,
  type UpdateValue,
} from "./shared";

const HAS_URL_PATTERN = /https?:\/\/[^\s]+/;

const QUICK_EMOJI = [
  "😀", "😍", "🔥", "🙌", "🎉", "✨", "👍", "🙏",
  "💜", "📩", "🚀", "💡", "✅", "👀", "💬", "🎁",
];

const ATTACHMENT_TYPES = [{ value: "image", label: "Image" }] as const;

export function MessageStep({
  values,
  update,
}: {
  values: RuleWizardValues;
  update: UpdateValue;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const dmRef = useRef<HTMLTextAreaElement>(null);

  function insertEmoji(emoji: string) {
    const textarea = dmRef.current;
    const at = textarea?.selectionStart ?? values.dm_message.length;
    const next = `${values.dm_message.slice(0, at)}${emoji}${values.dm_message.slice(
      at
    )}`.slice(0, DM_MAX_LENGTH);
    update("dm_message", next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(at + emoji.length, at + emoji.length);
    });
  }

  function updateButton(index: number, patch: { label?: string; url?: string }) {
    update(
      "dm_buttons",
      values.dm_buttons.map((button, position) =>
        position === index ? { ...button, ...patch } : button
      )
    );
  }

  function updateFollowup(index: number, patch: Partial<RuleFollowupValue>) {
    update(
      "followups",
      values.followups.map((followup, position) =>
        position === index ? { ...followup, ...patch } : followup
      )
    );
  }

  const hasButtons = values.dm_buttons.length > 0;

  // Local to this step — purely which fields show. Derived once from
  // whatever's already saved, so revisiting the step doesn't reset it.
  const [sendMode, setSendMode] = useState<"message" | "template">(() =>
    values.dm_card_subtitle.trim() || values.dm_default_action_url.trim()
      ? "template"
      : "message"
  );
  const isTemplate = sendMode === "template";

  function selectSendMode(mode: "message" | "template") {
    if (mode === "message") {
      // The card-only fields are meaningless without a real authored card —
      // clear them so they don't silently ride along if buttons stay on.
      update("dm_card_subtitle", "");
      update("dm_default_action_url", "");
      update("attachment_url", "");
    } else {
      // Template cards carry their text in the subtitle, not a separate
      // DM — clear it so a stale value can't get sent as a duplicate bubble.
      update("dm_message", "");
      if (!hasButtons) {
        update("dm_buttons", [{ label: "", url: "" }]);
      }
    }
    setSendMode(mode);
  }

  const delayValue = Number(values.send_delay_value);
  const delayLabel = Number.isFinite(delayValue) && delayValue > 0 ? delayValue : 1;
  const delayUnitLabel =
    DELAY_UNITS.find((unit) => unit.value === values.send_delay_unit)?.label ??
    "Minute";

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm font-semibold">
          Set a time delay
          <span className="text-rose-500" aria-hidden="true">
            {" "}
            *
          </span>
        </p>
        <div className="mt-2 flex gap-2.5">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={values.send_delay_value}
            onChange={(event) => update("send_delay_value", event.target.value)}
            // A rule always waits at least one unit, so an emptied or zeroed
            // field snaps back instead of silently meaning "send instantly".
            onBlur={(event) => {
              const amount = Number(event.target.value);
              if (!Number.isFinite(amount) || amount < 1) {
                update("send_delay_value", "1");
              }
            }}
            aria-label="Delay amount"
            className={`${fieldClass} flex-1`}
          />
          <div className="w-36">
            <SelectField
              value={values.send_delay_unit}
              aria-label="Delay unit"
              onChange={(event) =>
                update(
                  "send_delay_unit",
                  event.target.value as RuleWizardValues["send_delay_unit"]
                )
              }
            >
              {DELAY_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <ClockIcon className="h-3.5 w-3.5 shrink-0" />
          {`We'll wait ${delayLabel} ${delayUnitLabel.toLowerCase()}${
            delayLabel === 1 ? "" : "s"
          } after someone triggers this automation before sending the first DM. Minimum is 1.`}
        </p>
      </div>

      <div className="border-t border-black/8 pt-6 dark:border-white/10">
        <p className="text-sm font-semibold">
          Ask for something first (optional)
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Hold the primary DM back until they follow you or hand over their
          email. Leave both off to send it straight away.
        </p>

        <div className="mt-3 flex flex-col gap-3">
          <PreDmCard
            icon={<UserIcon className="h-4 w-4" />}
            title="Ask them to follow you first"
            note="Commenters who don't follow you yet get this message instead. The primary DM is sent once they follow."
            checked={values.require_follow}
            onChange={(checked) => update("require_follow", checked)}
          >
            <label
              htmlFor="rule_follow_prompt_message"
              className="mb-1.5 block text-sm font-semibold"
            >
              Message asking them to follow
            </label>
            <textarea
              id="rule_follow_prompt_message"
              rows={3}
              maxLength={DM_MAX_LENGTH}
              value={values.follow_prompt_message}
              onChange={(event) =>
                update("follow_prompt_message", event.target.value)
              }
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Use <code>{"{profile_link}"}</code> to insert a link to your
              profile.
            </p>
          </PreDmCard>

          <PreDmCard
            icon={<MailIcon className="h-4 w-4" />}
            title="Ask for their email first"
            note="Commenters get this message and reply with their email. It's saved as a lead, then the primary DM goes out automatically."
            checked={values.collect_email}
            onChange={(checked) => update("collect_email", checked)}
          >
            <label
              htmlFor="rule_email_prompt_message"
              className="mb-1.5 block text-sm font-semibold"
            >
              Message asking for their email
            </label>
            <textarea
              id="rule_email_prompt_message"
              rows={3}
              maxLength={DM_MAX_LENGTH}
              value={values.email_prompt_message}
              onChange={(event) =>
                update("email_prompt_message", event.target.value)
              }
              className={fieldClass}
            />
          </PreDmCard>
        </div>
      </div>

      <div className="border-t border-black/8 pt-6 dark:border-white/10">
        <p className="text-sm font-semibold">The primary DM</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Pick one way to send it. Buttons work either way — a template card
          also gets its own image, subtitle and tap-through link.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SendModeOption
            active={!isTemplate}
            title="Message"
            note="Plain text DM. Add buttons below it if you like — a short message rides on the same card."
            onClick={() => selectSendMode("message")}
          />
          <SendModeOption
            active={isTemplate}
            title="Template card"
            note="One card with an image, heading, subtitle and up to 3 buttons — like a product card."
            onClick={() => selectSendMode("template")}
          />
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-dashed border-black/12 p-4 dark:border-white/15">
          {!isTemplate && (
            <div className="flex flex-col">
              <label
                htmlFor="rule_dm_message"
                className="mb-1.5 text-sm font-semibold"
              >
                DM content
                {hasButtons && (
                  <span className="font-normal text-zinc-400">
                    {" "}
                    (optional)
                  </span>
                )}
              </label>

              <div className="rounded-xl border border-black/10 transition-all duration-200 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-white/12">
                <textarea
                  id="rule_dm_message"
                  ref={dmRef}
                  rows={6}
                  maxLength={DM_MAX_LENGTH}
                  value={values.dm_message}
                  onChange={(event) => update("dm_message", event.target.value)}
                  placeholder="Hey there! Thanks for commenting 🙌 Here's the link I mentioned ⬇️"
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
                    {values.dm_message.length}/{DM_MAX_LENGTH}
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

              {hasButtons && (
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Short enough and it rides on the card itself, as one bubble.
                  Longer, and it&apos;s sent first, on its own.
                </p>
              )}

              {HAS_URL_PATTERN.test(values.dm_message) && (
                <p className="mt-1.5 text-xs text-zinc-500">
                  Links are sent as plain text — Instagram turns them into a
                  tappable link for the recipient.
                </p>
              )}
            </div>
          )}

          {hasButtons && (
            <div className="flex flex-col">
              <label
                htmlFor="rule_card_title"
                className="mb-1.5 text-sm font-semibold"
              >
                Card heading
                <span className="text-rose-500" aria-hidden="true">
                  {" "}
                  *
                </span>
              </label>
              <div className="relative">
                <input
                  id="rule_card_title"
                  value={values.dm_button_card_title}
                  onChange={(event) =>
                    update("dm_button_card_title", event.target.value)
                  }
                  maxLength={CARD_TITLE_MAX_LENGTH}
                  placeholder="Tap the button below 👇"
                  className={`${fieldClass} pr-16`}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-zinc-400">
                  {values.dm_button_card_title.length}/{CARD_TITLE_MAX_LENGTH}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {isTemplate
                  ? "The card's bold headline, shown above the buttons."
                  : "Instagram shows buttons on a card. A short DM above rides on that card as its heading; a longer one is sent first, and the card below uses this heading instead."}
              </p>
            </div>
          )}

          {hasButtons && isTemplate && (
            <>
              <div className="flex flex-col">
                <label
                  htmlFor="rule_card_image"
                  className="mb-1.5 text-sm font-semibold"
                >
                  Card image (optional)
                </label>
                <p className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Shown at the top of the card, above the heading — not sent
                  as a separate message.
                </p>
                <input
                  id="rule_card_image"
                  value={values.attachment_url}
                  onChange={(event) =>
                    update("attachment_url", event.target.value)
                  }
                  placeholder="https://... (public image URL)"
                  aria-label="Card image URL"
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="rule_card_subtitle"
                  className="mb-1.5 text-sm font-semibold"
                >
                  Card subtitle (optional)
                </label>
                <div className="rounded-xl border border-black/10 transition-all duration-200 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-white/12">
                  <textarea
                    id="rule_card_subtitle"
                    rows={3}
                    value={values.dm_card_subtitle}
                    onChange={(event) =>
                      update("dm_card_subtitle", event.target.value)
                    }
                    maxLength={CARD_SUBTITLE_MAX_LENGTH}
                    placeholder="Explore our catalog"
                    className="w-full resize-y rounded-xl bg-transparent px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-400"
                  />
                  <span className="block px-3.5 pb-2 text-right text-xs text-zinc-400">
                    {values.dm_card_subtitle.length}/{CARD_SUBTITLE_MAX_LENGTH}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Your message, shown as a caption line under the heading.
                </p>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="rule_default_action_url"
                  className="mb-1.5 text-sm font-semibold"
                >
                  Open this link when the card is tapped (optional)
                </label>
                <input
                  id="rule_default_action_url"
                  value={values.dm_default_action_url}
                  onChange={(event) =>
                    update("dm_default_action_url", event.target.value)
                  }
                  placeholder="https://your-link.com"
                  className={fieldClass}
                />
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Makes the whole card tappable, not just its buttons. Leave
                  blank to require a button tap.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">
              Buttons
              <span className="font-normal text-zinc-400">
                {" "}
                (up to {MAX_BUTTONS})
              </span>
            </p>

            {values.dm_buttons.map((button, index) => (
              <div
                key={index}
                className="rounded-xl border border-black/8 p-3.5 dark:border-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    Button #{index + 1}
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove button ${index + 1}`}
                    onClick={() =>
                      update(
                        "dm_buttons",
                        values.dm_buttons.filter(
                          (_, position) => position !== index
                        )
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative mt-2">
                  <input
                    value={button.label}
                    onChange={(event) =>
                      updateButton(index, { label: event.target.value })
                    }
                    maxLength={BUTTON_LABEL_MAX_LENGTH}
                    placeholder="Click me"
                    aria-label={`Button ${index + 1} label`}
                    className={`${fieldClass} pr-16`}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-zinc-400">
                    {button.label.length}/{BUTTON_LABEL_MAX_LENGTH}
                  </span>
                </div>

                <p className="mt-3 mb-1.5 text-sm font-semibold">
                  When someone taps this button, open…
                </p>
                <input
                  value={button.url}
                  onChange={(event) =>
                    updateButton(index, { url: event.target.value })
                  }
                  placeholder="https://your-link.com"
                  aria-label={`Button ${index + 1} link`}
                  className={fieldClass}
                />
              </div>
            ))}

            {values.dm_buttons.length < MAX_BUTTONS && (
              <button
                type="button"
                onClick={() =>
                  update("dm_buttons", [
                    ...values.dm_buttons,
                    { label: "", url: "" },
                  ])
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                <PlusIcon className="h-4 w-4" />
                Add {values.dm_buttons.length > 0 ? "another " : "a "}button
              </button>
            )}
          </div>

          <div className="rounded-xl bg-zinc-50 p-3.5 dark:bg-white/5">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <ShieldIcon className="h-4 w-4 shrink-0" />
              Account safety
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Auto-replies on comments rotate between the wordings you wrote on
              the previous step, so not everyone sees the same text. Keep your
              DM wording human and your automation inside Instagram&apos;s
              messaging limits.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-black/8 pt-6 dark:border-white/10">
        <p className="text-sm font-semibold">Send follow-up messages</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Extra DMs sent after the primary one, each timed from when the
          primary DM goes out.
        </p>

        <div className="mt-3 flex flex-col gap-3">
          {values.followups.map((followup, index) => (
            <div
              key={index}
              className="rounded-xl border border-black/8 p-3.5 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Follow-up #{index + 1}</p>
                <button
                  type="button"
                  aria-label={`Remove follow-up ${index + 1}`}
                  onClick={() =>
                    update(
                      "followups",
                      values.followups.filter((_, position) => position !== index)
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex gap-2.5">
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={followup.delay_value}
                  onChange={(event) =>
                    updateFollowup(index, { delay_value: event.target.value })
                  }
                  aria-label={`Follow-up ${index + 1} delay`}
                  className={`${fieldClass} flex-1`}
                />
                <div className="w-36">
                  <SelectField
                    value={followup.delay_unit}
                    aria-label={`Follow-up ${index + 1} delay unit`}
                    onChange={(event) =>
                      updateFollowup(index, {
                        delay_unit: event.target
                          .value as RuleFollowupValue["delay_unit"],
                      })
                    }
                  >
                    {FOLLOWUP_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </SelectField>
                </div>
              </div>

              <textarea
                rows={3}
                maxLength={DM_MAX_LENGTH}
                value={followup.message}
                onChange={(event) =>
                  updateFollowup(index, { message: event.target.value })
                }
                placeholder="Still interested? Here's that link again 👇"
                aria-label={`Follow-up ${index + 1} message`}
                className={`${fieldClass} mt-2.5`}
              />
            </div>
          ))}

          {values.followups.length < MAX_FOLLOWUPS && (
            <button
              type="button"
              onClick={() =>
                update("followups", [
                  ...values.followups,
                  { delay_value: "1", delay_unit: "hour", message: "" },
                ])
              }
              className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              <PlusIcon className="h-4 w-4" />
              Add a follow-up
            </button>
          )}
        </div>
      </div>

      {!hasButtons && (
        <div className="border-t border-black/8 pt-6 dark:border-white/10">
          <p className="text-sm font-semibold">Attachment (optional)</p>
          <p className="mt-1 mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Sent as a second DM right after the primary one — a real inline
            image, not just a link.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="sm:w-32">
              <SelectField
                value={values.attachment_type}
                aria-label="Attachment type"
                onChange={(event) => update("attachment_type", event.target.value)}
              >
                {ATTACHMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <input
              value={values.attachment_url}
              onChange={(event) => update("attachment_url", event.target.value)}
              placeholder="https://... (public URL)"
              aria-label="Attachment URL"
              className={`${fieldClass} flex-1`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Choice between a plain-text DM and a generic-template card. Buttons are
 *  available either way; this only decides whether the card also gets its
 *  own image, subtitle and tap-through link. */
function SendModeOption({
  active,
  title,
  note,
  onClick,
}: {
  active: boolean;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-colors ${
        active
          ? "border-brand-400 bg-brand-50/60 dark:border-brand-400/60 dark:bg-brand-500/10"
          : "border-black/10 bg-white hover:bg-black/5 dark:border-white/12 dark:bg-white/5 dark:hover:bg-white/10"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
            active
              ? "border-brand-600 bg-brand-600"
              : "border-zinc-300 dark:border-zinc-600"
          }`}
        >
          {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        {title}
      </span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{note}</span>
    </button>
  );
}

/** Toggleable card for the DMs that go out ahead of the primary one. */
function PreDmCard({
  icon,
  title,
  note,
  checked,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 transition-colors ${
        checked
          ? "border-brand-300 bg-brand-50/60 dark:border-brand-400/50 dark:bg-brand-500/10"
          : "border-black/8 bg-white dark:border-white/10 dark:bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm dark:bg-zinc-900 dark:text-brand-300">
            {icon}
          </span>
          {title}
        </p>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-brand-600 dark:bg-zinc-700" />
          <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{note}</p>

      {checked && <div className="animate-fade-in-up mt-3">{children}</div>}
    </div>
  );
}
