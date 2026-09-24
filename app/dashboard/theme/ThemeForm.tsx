"use client";

import { useActionState, useEffect, useState } from "react";
import { LinkInBioPreview, type PreviewLink } from "../components/LinkInBioPreview";
import { primaryButtonClass } from "../components/styles";
import { useToast } from "../components/Toast";
import { updateTheme, type ThemeFormState } from "./actions";
import {
  THEME_BUTTON_STYLE_OPTIONS,
  THEME_FONT_OPTIONS,
  THEME_LAYOUT_OPTIONS,
} from "./themeOptions";
import type { Profile, ThemeButtonStyle, ThemeFont, ThemeLayout } from "@/lib/types";

export function ThemeForm({
  profile,
  previewLinks,
}: {
  profile: Profile;
  previewLinks: PreviewLink[];
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<ThemeFormState, FormData>(
    updateTheme,
    undefined
  );

  const [themeFont, setThemeFont] = useState<ThemeFont>(profile.theme_font);
  const [buttonStyle, setButtonStyle] = useState<ThemeButtonStyle>(
    profile.theme_button_style
  );
  const [layout, setLayout] = useState<ThemeLayout>(profile.theme_layout);

  useEffect(() => {
    if (!state) return;
    if ("error" in state) toast.error(state.error);
    else toast.success("Theme saved.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form
        action={formAction}
        className="flex flex-col gap-6 rounded-2xl border border-black/6 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4"
      >
        <input type="hidden" name="theme_font" value={themeFont} />
        <input type="hidden" name="theme_button_style" value={buttonStyle} />
        <input type="hidden" name="theme_layout" value={layout} />

        <OptionGroup label="Font">
          <div className="flex flex-wrap gap-2">
            {THEME_FONT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={themeFont === option.value}
                onClick={() => setThemeFont(option.value)}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm transition-colors ${option.sampleClass} ${
                  themeFont === option.value
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                    : "border-transparent bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/8 dark:text-zinc-300 dark:hover:bg-white/12"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </OptionGroup>

        <OptionGroup label="Button style">
          <div className="flex flex-wrap gap-2">
            {THEME_BUTTON_STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={buttonStyle === option.value}
                onClick={() => setButtonStyle(option.value)}
                className={`flex items-center gap-2 border-2 px-4 py-2.5 text-sm transition-colors ${option.radiusClass} ${
                  buttonStyle === option.value
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                    : "border-transparent bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/8 dark:text-zinc-300 dark:hover:bg-white/12"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </OptionGroup>

        <OptionGroup label="Layout">
          <div className="flex flex-wrap gap-2">
            {THEME_LAYOUT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={layout === option.value}
                onClick={() => setLayout(option.value)}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm transition-colors ${
                  layout === option.value
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                    : "border-transparent bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/8 dark:text-zinc-300 dark:hover:bg-white/12"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </OptionGroup>

        {state && "error" in state && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-end">
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Saving…" : "Save theme"}
          </button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-6">
        <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
          <LinkInBioPreview
            brandColor={profile.brand_color || "#6366f1"}
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            username={profile.username}
            bio={profile.bio}
            links={previewLinks}
            themeFont={themeFont}
            buttonStyle={buttonStyle}
            layout={layout}
          />
        </div>
      </aside>
    </div>
  );
}

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </div>
  );
}
