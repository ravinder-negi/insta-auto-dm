"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { fieldClass } from "@/components/ui/controls";
import {
  CheckIcon,
  CloseIcon,
  ImageIcon,
  InfoIcon,
  InstagramIcon,
  LayersIcon,
  PlusIcon,
  VideoCameraIcon,
} from "@/components/icons";
import type { InstagramMediaOption } from "@/lib/hooks/useInstagramMedia";
import {
  MAX_KEYWORDS,
  type FlowWizardAccountOption,
  type KeywordMatch,
  type MediaScope,
} from "./shared";

const MATCHES: { value: KeywordMatch; label: string }[] = [
  { value: "specific", label: "Specific keyword" },
  { value: "any", label: "Any comment" },
];

/** Tiles are a fixed height so the picker can show exactly two rows before it
 *  scrolls, instead of cutting the second row mid-image. */
const TILE_CLASS = "h-28 sm:h-32";
const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5";

const SCOPES: { value: MediaScope; label: string; hint: string }[] = [
  {
    value: "specific",
    label: "Specific Post/Reel",
    hint: "Only comments on the post you pick below trigger this flow.",
  },
  {
    value: "any",
    label: "Any Post/Reel",
    hint: "Comments on every post of this account trigger this flow.",
  },
];

function mediaTypeIcon(mediaType: string) {
  const type = mediaType.toUpperCase();
  if (type === "VIDEO" || type === "REELS" || type === "REEL") {
    return <VideoCameraIcon className="h-3.5 w-3.5" />;
  }
  if (type === "CAROUSEL_ALBUM") return <LayersIcon className="h-3.5 w-3.5" />;
  return <ImageIcon className="h-3.5 w-3.5" />;
}

export function TriggerStep({
  account,
  scope,
  onScopeChange,
  mediaId,
  onMediaIdChange,
  items,
  loading,
  error,
  manualEntry,
  onManualEntryChange,
  keywordMatch,
  onKeywordMatchChange,
  keywords,
  onKeywordsChange,
  excludedKeywords,
  onExcludedKeywordsChange,
}: {
  account?: FlowWizardAccountOption;
  scope: MediaScope;
  onScopeChange: (scope: MediaScope) => void;
  mediaId: string;
  onMediaIdChange: (id: string) => void;
  items: InstagramMediaOption[];
  loading: boolean;
  error: string | null;
  manualEntry: boolean;
  onManualEntryChange: (manual: boolean) => void;
  keywordMatch: KeywordMatch;
  onKeywordMatchChange: (value: KeywordMatch) => void;
  keywords: string[];
  onKeywordsChange: (values: string[]) => void;
  excludedKeywords: string[];
  onExcludedKeywordsChange: (values: string[]) => void;
}) {
  const [showExcluded, setShowExcluded] = useState(excludedKeywords.length > 0);
  const activeScope = SCOPES.find((item) => item.value === scope);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="ig-gradient flex h-16 w-16 items-center justify-center rounded-full">
          <Avatar
            name={account?.handle ?? "?"}
            size="lg"
            className="h-14 w-14 border-2 border-white dark:border-zinc-900"
          />
        </span>
        <p className="text-sm font-semibold">{account?.label ?? "No account"}</p>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">The comment is on…</legend>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {SCOPES.map((option) => {
            const active = option.value === scope;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onScopeChange(option.value)}
                className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "border-brand-500 bg-brand-50/70 text-brand-700 ring-2 ring-brand-500/15 dark:border-brand-400/70 dark:bg-brand-500/10 dark:text-brand-300"
                    : "border-black/8 bg-white hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/40 dark:hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {activeScope && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {activeScope.hint}
          </p>
        )}
      </fieldset>

      {scope === "specific" && (
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Pick a post or reel</p>
            <button
              type="button"
              onClick={() => onManualEntryChange(!manualEntry)}
              className="text-xs font-semibold text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
            >
              {manualEntry ? "Pick from your posts" : "Enter a media ID"}
            </button>
          </div>

          {manualEntry ? (
            <input
              value={mediaId}
              onChange={(event) => onMediaIdChange(event.target.value)}
              placeholder="Instagram media ID"
              autoComplete="off"
              className={`${fieldClass} mt-3`}
            />
          ) : loading ? (
            <div className={`mt-3 ${GRID_CLASS}`}>
              {Array.from({ length: 8 }).map((_, index) => (
                <span
                  key={index}
                  className={`${TILE_CLASS} animate-pulse rounded-xl bg-black/6 dark:bg-white/8`}
                />
              ))}
            </div>
          ) : error ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
              {error}
            </p>
          ) : items.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-black/10 px-3.5 py-6 text-center text-xs text-zinc-500 dark:border-white/12 dark:text-zinc-400">
              No posts found on this account yet.
            </p>
          ) : (
            <div
              className={`mt-3 max-h-[234px] overflow-y-auto sm:max-h-[266px] ${GRID_CLASS}`}
            >
              {items.map((item) => {
                const active = item.id === mediaId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    title={item.caption?.trim() || "(no caption)"}
                    onClick={() => onMediaIdChange(active ? "" : item.id)}
                    className={`group relative ${TILE_CLASS} overflow-hidden rounded-xl border transition-all duration-200 ${
                      active
                        ? "border-brand-500 ring-2 ring-brand-500/25"
                        : "border-black/8 hover:border-brand-300 dark:border-white/10"
                    }`}
                  >
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN URL, no next/image domain config
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                        <InstagramIcon className="h-5 w-5" />
                      </span>
                    )}

                    <span className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                      {mediaTypeIcon(item.media_type)}
                    </span>

                    {active && (
                      <span className="absolute inset-0 flex items-center justify-center bg-brand-600/35">
                        <span className="brand-gradient flex h-7 w-7 items-center justify-center rounded-full text-white shadow">
                          <CheckIcon className="h-4 w-4" />
                        </span>
                      </span>
                    )}

                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pt-4 pb-1 text-left text-[10px] text-white">
                      {new Date(item.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <fieldset>
        <legend className="text-sm font-semibold">
          What kind of comment should trigger this flow?
        </legend>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {MATCHES.map((option) => {
            const active = option.value === keywordMatch;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onKeywordMatchChange(option.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "border-brand-500 bg-brand-50/70 text-brand-700 ring-2 ring-brand-500/15 dark:border-brand-400/70 dark:bg-brand-500/10 dark:text-brand-300"
                    : "border-black/8 bg-white hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400/40 dark:hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {keywordMatch === "specific" ? (
        <div className="flex flex-col gap-5">
          <ChipInput
            label="Should include any of these:"
            placeholder="Type a keyword (min. 1 character)"
            values={keywords}
            onChange={onKeywordsChange}
            hint={
              <>
                Keywords are not case-sensitive. A comment triggers this flow
                when it contains a keyword as a whole word — the keyword
                &quot;ai&quot; matches &quot;ai&quot; but not &quot;pain&quot;.
              </>
            }
          />

          {showExcluded ? (
            <ChipInput
              label="Never trigger when the comment includes:"
              placeholder="Type a keyword to exclude"
              values={excludedKeywords}
              onChange={onExcludedKeywordsChange}
              hint="An excluded keyword anywhere in the comment stops this flow, even when a trigger keyword also matches."
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowExcluded(true)}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
            >
              Add excluded keywords?
              <InfoIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <p className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
          Every comment triggers this flow — no keyword needed. Your own
          comments and replies are ignored.
        </p>
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
      <p className="text-sm font-semibold">{label}</p>

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
          className="absolute top-1/2 right-1.5 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pr-1.5 pl-3 text-xs font-semibold text-brand-700 dark:border-brand-400/40 dark:bg-brand-500/10 dark:text-brand-300"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() =>
                  onChange(values.filter((existing) => existing !== value))
                }
                className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-brand-500 transition-colors hover:bg-brand-500/15"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {hint && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}
