"use client";

import { useState } from "react";
import { fieldClass } from "@/components/ui/controls";
import { CloseIcon, InfoIcon, PlusIcon } from "@/components/icons";
import {
  MAX_KEYWORDS,
  PUBLIC_REPLY_MAX_LENGTH,
  PUBLIC_REPLY_SLOTS,
  type KeywordMatch,
  type RuleWizardValues,
  type UpdateValue,
} from "./shared";

const COPY = {
  comment_keyword: {
    legend: "What kind of comment should trigger this automation?",
    anyOption: "Any comment",
    anyNotice:
      "Every comment triggers this AutoDM — no keyword needed. Your own comments and replies are ignored.",
    includeLabel: "Should include any of these:",
    includePlaceholder: "Type a keyword (min. 1 character)",
    includeHint: (
      <>
        Keywords are not case-sensitive (e.g. &quot;Hello&quot; and
        &quot;hello&quot; are treated the same). A comment triggers this
        AutoDM when it contains a keyword as a whole word — the keyword
        &quot;ai&quot; matches &quot;ai&quot; but not &quot;pain&quot;.
      </>
    ),
    excludeHint:
      "An excluded keyword anywhere in the comment stops this AutoDM, even when a trigger keyword also matches.",
  },
  story_reply: {
    legend: "What kind of story reply should trigger this automation?",
    anyOption: "Any reply",
    anyNotice:
      "Every reply to this story triggers this AutoDM — no keyword needed. Your own messages are ignored.",
    includeLabel: "Should include any of these:",
    includePlaceholder: "Type a keyword (min. 1 character)",
    includeHint: (
      <>
        Keywords are not case-sensitive. A story reply triggers this AutoDM
        when it contains a keyword as a whole word — the keyword
        &quot;ai&quot; matches &quot;ai&quot; but not &quot;pain&quot;.
      </>
    ),
    excludeHint:
      "An excluded keyword anywhere in the reply stops this AutoDM, even when a trigger keyword also matches.",
  },
  live_comment: {
    legend: "What kind of Live comment should trigger this automation?",
    anyOption: "Any comment",
    anyNotice:
      "Every comment on any of your Lives triggers this AutoDM — no keyword needed. Your own comments and replies are ignored.",
    includeLabel: "Should include any of these:",
    includePlaceholder: "Type a keyword (min. 1 character)",
    includeHint: (
      <>
        Keywords are not case-sensitive (e.g. &quot;Hello&quot; and
        &quot;hello&quot; are treated the same). A comment triggers this
        AutoDM when it contains a keyword as a whole word — the keyword
        &quot;ai&quot; matches &quot;ai&quot; but not &quot;pain&quot;.
      </>
    ),
    excludeHint:
      "An excluded keyword anywhere in the comment stops this AutoDM, even when a trigger keyword also matches.",
  },
  post_share: {
    legend: "What triggers this automation?",
    anyOption: "Any share",
    anyNotice:
      "Sharing any post or reel of this account into a DM triggers this AutoDM — a shared post carries no text, so there's no keyword to match.",
    includeLabel: "Should include any of these:",
    includePlaceholder: "Type a keyword (min. 1 character)",
    includeHint: <></>,
    excludeHint: "",
  },
} as const;

export function KeywordStep({
  values,
  update,
}: {
  values: RuleWizardValues;
  update: UpdateValue;
}) {
  const [showExcluded, setShowExcluded] = useState(
    values.excluded_keywords.length > 0
  );

  const copy = COPY[values.trigger_type];
  const isStory = values.trigger_type === "story_reply";
  const isLive = values.trigger_type === "live_comment";
  const isShare = values.trigger_type === "post_share";

  const matches: { value: KeywordMatch; label: string }[] = [
    { value: "specific", label: "Specific keyword" },
    { value: "any", label: copy.anyOption },
  ];

  function setReplyAt(index: number, message: string) {
    const next = Array.from(
      { length: PUBLIC_REPLY_SLOTS },
      (_, slot) => values.public_reply_messages[slot] ?? ""
    );
    next[index] = message.slice(0, PUBLIC_REPLY_MAX_LENGTH);
    update("public_reply_messages", next);
  }

  return (
    <div className="flex flex-col gap-6">
      {!isShare && (
        <fieldset>
          <legend className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {copy.legend}
          </legend>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {matches.map((option) => {
              const active = option.value === values.keyword_match;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update("keyword_match", option.value)}
                  className="rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-faint-bg)]"
                  style={
                    active
                      ? { borderColor: "var(--primary)", backgroundColor: "var(--tint-faint)", color: "var(--primary-strong)", boxShadow: "0 0 0 2px color-mix(in srgb, var(--primary) 15%, transparent)" }
                      : { borderColor: "var(--line)", backgroundColor: "#fff", color: "var(--ink)" }
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {isShare ? (
        <p
          className="flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-xs"
          style={{ borderColor: "#F0D9A6", backgroundColor: "var(--warning-tint)", color: "var(--warning-text)" }}
        >
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {copy.anyNotice}
        </p>
      ) : values.keyword_match === "specific" ? (
        <div className="flex flex-col gap-5">
          <ChipInput
            label={copy.includeLabel}
            placeholder={copy.includePlaceholder}
            values={values.keywords}
            onChange={(next) => update("keywords", next)}
            hint={copy.includeHint}
          />

          {showExcluded ? (
            <ChipInput
              label={`Never trigger when the ${isStory ? "reply" : "comment"} includes:`}
              placeholder="Type a keyword to exclude"
              values={values.excluded_keywords}
              onChange={(next) => update("excluded_keywords", next)}
              hint={copy.excludeHint}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowExcluded(true)}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Add excluded keywords?
              <InfoIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <p
          className="flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-xs"
          style={{ borderColor: "#F0D9A6", backgroundColor: "var(--warning-tint)", color: "var(--warning-text)" }}
        >
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {copy.anyNotice}
        </p>
      )}

      {!isStory && !isShare && (
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", backgroundColor: "var(--bg)" }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              {isLive ? "Auto-Reply to comments on the Live" : "Auto-Reply to comments on the post"}
            </p>
            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={values.send_public_reply}
                onChange={(event) =>
                  update("send_public_reply", event.target.checked)
                }
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-[var(--secondary-pale)] transition-colors peer-checked:bg-[var(--success)]" />
              <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          {values.send_public_reply && (
            <div className="animate-fade-in-up mt-3 flex flex-col gap-3.5">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Write up to {PUBLIC_REPLY_SLOTS} replies — one is picked at random
                per comment so your replies don&apos;t look like a bot. Automating
                comment replies carries risk; keep them varied and human.
              </p>

              {Array.from({ length: PUBLIC_REPLY_SLOTS }).map((_, index) => {
                const value = values.public_reply_messages[index] ?? "";

                return (
                  <div key={index} className="flex flex-col">
                    <label
                      htmlFor={`public_reply_${index}`}
                      className="mb-1.5 text-sm font-semibold"
                      style={{ color: "var(--ink)" }}
                    >
                      Comment response {index + 1}
                      {index === 0 && (
                        <span style={{ color: "var(--primary)" }} aria-hidden="true">
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
                      <span
                        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs"
                        style={{ color: "var(--muted-soft)" }}
                      >
                        {value.length}/{PUBLIC_REPLY_MAX_LENGTH}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Add-on-Enter list of short strings, rendered as removable chips. */
function ChipInput({
  label,
  placeholder,
  values,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  hint?: React.ReactNode;
}) {
  const [draft, setDraft] = useState("");
  const full = values.length >= MAX_KEYWORDS;

  function add() {
    const value = draft.trim();
    if (!value || full) return;

    const duplicate = values.some(
      (existing) => existing.toLowerCase() === value.toLowerCase()
    );
    if (!duplicate) onChange([...values, value]);

    setDraft("");
  }

  return (
    <div className="flex flex-col">
      <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
        {label}
      </p>

      <div className="relative mt-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add();
            }
          }}
          disabled={full}
          placeholder={full ? `Limit of ${MAX_KEYWORDS} reached` : placeholder}
          autoComplete="off"
          className={`${fieldClass} pr-24`}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || full}
          className="absolute top-1/2 right-1.5 inline-flex -translate-y-1/2 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--secondary-soft-bg)] disabled:opacity-40"
          style={{ borderColor: "var(--line)", backgroundColor: "#fff", color: "var(--ink)" }}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-3 text-xs font-bold"
              style={{ backgroundColor: "var(--tint2)", color: "var(--violet)" }}
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() =>
                  onChange(values.filter((existing) => existing !== value))
                }
                className="flex h-4.5 w-4.5 items-center justify-center rounded-full transition-colors hover:bg-[var(--violet)]/15"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {hint && (
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
