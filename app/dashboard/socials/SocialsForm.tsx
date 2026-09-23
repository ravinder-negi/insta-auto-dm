"use client";

import { useActionState, useEffect, useState } from "react";
import { fieldClass } from "../components/controls";
import { primaryButtonClass } from "../components/styles";
import { useToast } from "../components/Toast";
import { updateSocials, type SocialsFormState } from "./actions";
import { SOCIAL_PLATFORM_META, SOCIAL_PLATFORMS } from "./socialPlatforms";
import type { ProfileSocial, SocialPlatform } from "@/lib/types";

export function SocialsForm({ socials }: { socials: ProfileSocial[] }) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<SocialsFormState, FormData>(
    updateSocials,
    undefined
  );

  const byPlatform = new Map(socials.map((social) => [social.platform, social]));

  useEffect(() => {
    if (!state) return;
    if ("error" in state) toast.error(state.error);
    else toast.success("Social accounts saved.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5 dark:border-white/8 dark:bg-white/4"
    >
      {SOCIAL_PLATFORMS.map((platform) => {
        const existing = byPlatform.get(platform);
        return (
          <PlatformRow
            // Re-key on the saved values so a successful save remounts the row
            // and picks up the fresh url/is_active instead of stale local state.
            key={`${platform}-${existing?.url ?? ""}-${existing?.is_active ?? true}`}
            platform={platform}
            existing={existing}
          />
        );
      })}

      {state && "error" in state && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function PlatformRow({
  platform,
  existing,
}: {
  platform: SocialPlatform;
  existing?: ProfileSocial;
}) {
  const meta = SOCIAL_PLATFORM_META[platform];
  const Icon = meta.icon;
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/8 p-3 dark:border-white/10">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5"
        style={{ background: meta.background, color: meta.foreground ?? "#ffffff" }}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <label
          htmlFor={`${platform}_url`}
          className="mb-1 block text-xs font-medium text-zinc-500"
        >
          {meta.label}
        </label>
        <input
          id={`${platform}_url`}
          name={`${platform}_url`}
          type={meta.inputType}
          defaultValue={existing?.url.replace(/^mailto:/, "") ?? ""}
          placeholder={meta.placeholder}
          className={fieldClass}
        />
      </div>

      <label
        className="relative inline-flex shrink-0 cursor-pointer items-center self-end"
        title={isActive ? "Shown on profile" : "Hidden from profile"}
      >
        <input
          type="checkbox"
          name={`${platform}_active`}
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-indigo-600 dark:bg-zinc-700" />
        <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}
