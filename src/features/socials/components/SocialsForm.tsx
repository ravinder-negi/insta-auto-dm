"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { displayFont } from "@/lib/linkInBioTheme";
import { CheckIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { updateSocials, type SocialsFormState } from "@/features/socials/actions";
import { SOCIAL_PLATFORM_META, SOCIAL_PLATFORMS } from "@/features/socials/socialPlatforms";
import type { ProfileSocial, SocialPlatform } from "@/types";

type RowValue = { url: string; isActive: boolean };
type Values = Record<SocialPlatform, RowValue>;

function buildInitialValues(socials: ProfileSocial[]): Values {
  const byPlatform = new Map(socials.map((social) => [social.platform, social]));
  const values = {} as Values;
  for (const platform of SOCIAL_PLATFORMS) {
    const existing = byPlatform.get(platform);
    values[platform] = {
      url: existing?.url.replace(/^mailto:/, "") ?? "",
      isActive: existing?.is_active ?? true,
    };
  }
  return values;
}

export function SocialsForm({ socials }: { socials: ProfileSocial[] }) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<SocialsFormState, FormData>(
    updateSocials,
    undefined
  );

  const initialValues = useMemo(() => buildInitialValues(socials), [socials]);
  const [values, setValues] = useState<Values>(initialValues);
  const [saved, setSaved] = useState<Values>(initialValues);

  useEffect(() => {
    if (!state) return;
    if ("error" in state) {
      toast.error(state.error);
    } else {
      toast.success("Social accounts saved.");
      // Reacting to the server action's completion, not deriving state from
      // a render — the documented exception to "don't setState in effects".
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function setRow(platform: SocialPlatform, patch: Partial<RowValue>) {
    setValues((prev) => ({ ...prev, [platform]: { ...prev[platform], ...patch } }));
  }

  function discard() {
    setValues(saved);
    toast.info("Changes discarded.");
  }

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const connectedCount = SOCIAL_PLATFORMS.filter(
    (platform) => values[platform].url.trim() && values[platform].isActive
  ).length;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`m-0 ${displayFont} text-xl font-extrabold tracking-[-0.02em]`}>
          Your platforms
        </h2>
        <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 py-1.5 text-sm font-bold text-[var(--muted)]">
          <span
            className={`h-2 w-2 rounded-full ${connectedCount > 0 ? "animate-pulse-soft" : ""}`}
            style={{ background: connectedCount > 0 ? "var(--success)" : "#D4CFC3" }}
          />
          {connectedCount} of {SOCIAL_PLATFORMS.length} live
        </span>
      </div>

      {state && "error" in state && (
        <p
          role="alert"
          className="rounded-2xl border-[1.5px] px-4 py-3 text-sm font-semibold"
          style={{ borderColor: "var(--danger-ring)", background: "var(--danger-tint)", color: "var(--danger-strong)" }}
        >
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map((platform) => (
          <PlatformCard
            key={platform}
            platform={platform}
            value={values[platform]}
            onChange={(patch) => setRow(platform, patch)}
          />
        ))}
      </div>

      {dirty ? (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="sticky bottom-5 z-10 flex flex-wrap items-center justify-between gap-3 rounded-full py-3.5 pr-4 pl-6 text-white shadow-[0_26px_50px_-18px_color-mix(in srgb, var(--ink) 65%, transparent)]"
          style={{ background: "var(--ink)" }}
        >
          <span className="inline-flex items-center gap-2.5 font-semibold">
            <span className="animate-pulse-soft h-[9px] w-[9px] rounded-full bg-[#F5B84B]" />
            You have unsaved changes
          </span>
          <span className="flex gap-2.5">
            <button
              type="button"
              onClick={discard}
              className="min-h-[46px] cursor-pointer rounded-full border-[1.5px] border-white/30 bg-transparent px-5 font-semibold text-white"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={pending}
              className="min-h-[46px] cursor-pointer rounded-full border-0 px-6 font-bold text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--muted)]">
          <CheckIcon className="h-[18px] w-[18px] text-[var(--success)]" />
          All changes saved
        </div>
      )}
    </form>
  );
}

function PlatformCard({
  platform,
  value,
  onChange,
}: {
  platform: SocialPlatform;
  value: RowValue;
  onChange: (patch: Partial<RowValue>) => void;
}) {
  const meta = SOCIAL_PLATFORM_META[platform];
  const Icon = meta.icon;
  const hasUrl = value.url.trim().length > 0;
  const live = hasUrl && value.isActive;

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border-[1.5px] border-[var(--line)] bg-white p-5 transition-colors hover:border-[#D6CCF5]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: meta.background, color: meta.foreground ?? "#ffffff" }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="font-bold">{meta.label}</div>
            <div
              className="text-xs font-semibold"
              style={{ color: live ? "var(--success)" : hasUrl ? "var(--muted)" : "#B9B2A3" }}
            >
              {live ? "Live on your profile" : hasUrl ? "Hidden from profile" : "Not added"}
            </div>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={live}
          aria-label={`${live ? "Hide" : "Show"} ${meta.label} on your profile`}
          onClick={() => onChange({ isActive: !value.isActive })}
          className="h-8 w-[52px] shrink-0 cursor-pointer rounded-full border-0 p-1 transition-colors"
          style={{ background: live ? "var(--success)" : "var(--line)" }}
        >
          <span
            className="block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.2)] transition-transform"
            style={{ transform: live ? "translateX(20px)" : "translateX(0)" }}
          />
        </button>
        <input
          type="checkbox"
          name={`${platform}_active`}
          checked={value.isActive}
          onChange={(event) => onChange({ isActive: event.target.checked })}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      <div
        className="rounded-[14px] border-[1.5px] bg-[var(--bg)] px-3.5 transition-colors focus-within:border-[var(--accent)] focus-within:bg-white"
        style={{ borderColor: "var(--line)" }}
      >
        <label htmlFor={`${platform}_url`} className="sr-only">
          {meta.label} link
        </label>
        <input
          id={`${platform}_url`}
          name={`${platform}_url`}
          type={meta.inputType}
          value={value.url}
          onChange={(event) => onChange({ url: event.target.value })}
          placeholder={meta.placeholder}
          className="min-h-[48px] w-full border-0 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}
