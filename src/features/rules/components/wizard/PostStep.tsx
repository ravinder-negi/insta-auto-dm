"use client";

import { Avatar } from "@/components/ui/Avatar";
import { fieldClass } from "@/components/ui/controls";
import {
  CheckIcon,
  ImageIcon,
  InstagramIcon,
  LayersIcon,
  SparkleIcon,
  VideoCameraIcon,
} from "@/components/icons";
import type {
  InstagramMediaOption,
  MediaScope,
  RuleWizardAccountOption,
  TriggerType,
} from "./shared";
import { shortcodeFromPermalink } from "./shared";

/** Tiles are a fixed height so the picker can show exactly two rows before it
 *  scrolls, instead of cutting the second row mid-image. */
const TILE_CLASS = "h-28 sm:h-32";
const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5";

const SCOPES: Record<
  TriggerType,
  { value: MediaScope; label: string; hint: string }[]
> = {
  comment_keyword: [
    {
      value: "specific",
      label: "Specific Post/Reel",
      hint: "Only comments on the post you pick below trigger this AutoDM.",
    },
    {
      value: "any",
      label: "Any Post/Reel",
      hint: "Comments on every post of this account trigger this AutoDM.",
    },
  ],
  story_reply: [
    {
      value: "specific",
      label: "Specific Story",
      hint: "Only replies to the story you pick below trigger this AutoDM.",
    },
    {
      value: "any",
      label: "Any Story",
      hint: "A reply to any currently live story triggers this AutoDM.",
    },
  ],
  live_comment: [
    {
      value: "any",
      label: "Any Live",
      hint: "Every comment on any of your Lives triggers this AutoDM — a Live can't be picked ahead of time.",
    },
  ],
  post_share: [
    {
      value: "specific",
      label: "Specific Post/Reel",
      hint: "Only a share of the post you pick below triggers this AutoDM.",
    },
    {
      value: "any",
      label: "Any Post/Reel",
      hint: "Sharing any post or reel of this account into your DMs triggers this AutoDM.",
    },
  ],
};

function mediaTypeIcon(mediaType: string) {
  const type = mediaType.toUpperCase();
  if (type === "VIDEO" || type === "REELS" || type === "REEL") {
    return <VideoCameraIcon className="h-3.5 w-3.5" />;
  }
  if (type === "CAROUSEL_ALBUM") return <LayersIcon className="h-3.5 w-3.5" />;
  return <ImageIcon className="h-3.5 w-3.5" />;
}

export function PostStep({
  account,
  triggerType,
  scope,
  onScopeChange,
  mediaId,
  onMediaIdChange,
  shortcode,
  onShortcodeChange,
  items,
  loading,
  error,
  manualEntry,
  onManualEntryChange,
}: {
  account?: RuleWizardAccountOption;
  triggerType: TriggerType;
  scope: MediaScope;
  onScopeChange: (scope: MediaScope) => void;
  mediaId: string;
  onMediaIdChange: (id: string) => void;
  /** Only used by post_share — see shared.ts. */
  shortcode: string;
  onShortcodeChange: (shortcode: string) => void;
  items: InstagramMediaOption[];
  loading: boolean;
  error: string | null;
  manualEntry: boolean;
  onManualEntryChange: (manual: boolean) => void;
}) {
  const scopes = SCOPES[triggerType];
  const activeScope = scopes.find((item) => item.value === scope);
  const isStory = triggerType === "story_reply";
  const isLive = triggerType === "live_comment";
  const isShare = triggerType === "post_share";

  function isActiveItem(item: InstagramMediaOption) {
    if (isShare) {
      // A rule saved before the real media id was captured only has a
      // shortcode — fall back to matching on that.
      if (mediaId) return item.id === mediaId;
      const itemShortcode = shortcodeFromPermalink(item.permalink);
      return itemShortcode !== null && itemShortcode === shortcode;
    }
    return item.id === mediaId;
  }

  function selectItem(item: InstagramMediaOption) {
    const active = isActiveItem(item);

    if (isShare) {
      // Store both: the real media id is what a share with a CDN-only url
      // (no parseable permalink, e.g. an image post) gets matched on; the
      // shortcode is the fallback for shares that only carry a permalink.
      onMediaIdChange(active ? "" : item.id);
      onShortcodeChange(active ? "" : (shortcodeFromPermalink(item.permalink) ?? ""));
      return;
    }

    onMediaIdChange(active ? "" : item.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="ig-gradient flex h-16 w-16 items-center justify-center rounded-full">
          <Avatar name={account?.handle ?? "?"} size="lg" className="h-14 w-14 border-2 border-white" />
        </span>
        <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {account?.label ?? "No account"}
        </p>
      </div>

      {!isLive && (
        <fieldset>
          <legend className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {isStory
              ? "The story reply is on…"
              : isShare
                ? "The share is of…"
                : "The comment is on…"}
          </legend>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {scopes.map((option) => {
              const active = option.value === scope;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onScopeChange(option.value)}
                  className="flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:border-[var(--secondary-border)] hover:bg-[var(--secondary-faint-bg)]"
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

          {activeScope && (
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
              {activeScope.hint}
            </p>
          )}
        </fieldset>
      )}

      {scope === "specific" ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              {isStory ? "Pick a story" : "Pick a post or reel"}
            </p>
            <button
              type="button"
              onClick={() => onManualEntryChange(!manualEntry)}
              className="text-xs font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--primary)" }}
            >
              {manualEntry
                ? `Pick from your ${isStory ? "stories" : "posts"}`
                : "Enter a media ID"}
            </button>
          </div>

          {manualEntry ? (
            <input
              value={isShare ? shortcode : mediaId}
              onChange={(event) => {
                if (isShare) {
                  const value = event.target.value;
                  onShortcodeChange(shortcodeFromPermalink(value) ?? value.trim());
                  return;
                }
                onMediaIdChange(event.target.value);
              }}
              placeholder={isShare ? "Paste the post/reel link" : "Instagram media ID"}
              autoComplete="off"
              className={`${fieldClass} mt-3`}
            />
          ) : loading ? (
            <div className={`mt-3 ${GRID_CLASS}`}>
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} className={`${TILE_CLASS} animate-pulse rounded-xl`} style={{ backgroundColor: "var(--neutral-tint)" }} />
              ))}
            </div>
          ) : error ? (
            <p
              className="mt-3 rounded-xl border px-3.5 py-2.5 text-xs"
              style={{ borderColor: "#F0D9A6", backgroundColor: "var(--warning-tint)", color: "var(--warning-text)" }}
            >
              {error}
            </p>
          ) : items.length === 0 ? (
            <p
              className="mt-3 rounded-xl border border-dashed px-3.5 py-6 text-center text-xs"
              style={{ borderColor: "var(--line)", color: "var(--muted)" }}
            >
              {isStory
                ? "No stories currently live on this account. Post a story, then come back and pick it here — it only stays listed for 24 hours."
                : "No posts found on this account yet."}
            </p>
          ) : (
            <div
              className={`mt-3 max-h-[234px] overflow-y-auto sm:max-h-[266px] ${GRID_CLASS}`}
            >
              {items.map((item) => {
                const active = isActiveItem(item);

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    title={item.caption?.trim() || "(no caption)"}
                    onClick={() => selectItem(item)}
                    className={`group relative ${TILE_CLASS} overflow-hidden rounded-xl border transition-all duration-200`}
                    style={active ? { borderColor: "var(--primary)", boxShadow: "0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent)" } : { borderColor: "var(--line)" }}
                  >
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN URL, no next/image domain config
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--neutral-tint)", color: "var(--muted-soft)" }}>
                        <InstagramIcon className="h-5 w-5" />
                      </span>
                    )}

                    <span className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                      {mediaTypeIcon(item.media_type)}
                    </span>

                    {active && (
                      <span className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 35%, transparent)" }}>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow" style={{ backgroundColor: "var(--primary)" }}>
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
      ) : (
        <p
          className="flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-xs"
          style={{ borderColor: "var(--line)", backgroundColor: "var(--bg)", color: "var(--muted)" }}
        >
          <SparkleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--violet)]" />
          {isStory
            ? `Every story reply on ${account?.label ?? "this account"} is checked for your keyword — no story to pick.`
            : isLive
              ? `Every comment on any Live by ${account?.label ?? "this account"} is checked for your keyword — a Live doesn't exist to pick before it starts.`
              : isShare
                ? `Any post or reel of ${account?.label ?? "this account"} shared into your DMs triggers this AutoDM — no post to pick.`
                : `Every comment on ${account?.label ?? "this account"} is checked for your keyword — no post to pick.`}
        </p>
      )}
    </div>
  );
}
