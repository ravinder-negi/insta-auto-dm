"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { LinkInBioPreview, type PreviewLink } from "@/features/links/components/LinkInBioPreview";
import { displayFont } from "@/lib/linkInBioTheme";
import { CheckIcon, DesktopIcon, ImageIcon, LayersIcon, MobileIcon, PaletteIcon, PencilIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { updateTheme, type ThemeFormState } from "@/features/theme/actions";
import {
  THEME_BUTTON_STYLE_OPTIONS,
  THEME_FONT_OPTIONS,
  THEME_TEMPLATE_OPTIONS,
} from "@/features/theme/themeOptions";
import type { Profile, ThemeButtonStyle, ThemeFont, ThemeLayout, ThemeTemplate } from "@/types";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;
const COLOR_PRESETS = [
  "#6366F1",
  "#4F46E5",
  "#5B3FE0",
  "#0B7A5C",
  "#F59E0B",
  "#0EA5E9",
  "#15131C",
];

type Values = {
  template: ThemeTemplate;
  font: ThemeFont;
  buttonStyle: ThemeButtonStyle;
  layout: ThemeLayout;
  brandColor: string;
};

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

  const initialValues = useMemo<Values>(
    () => ({
      template: profile.theme_template,
      font: profile.theme_font,
      buttonStyle: profile.theme_button_style,
      layout: profile.theme_layout,
      brandColor: (profile.brand_color || "#6366F1").toUpperCase(),
    }),
    [profile]
  );

  const [values, setValues] = useState<Values>(initialValues);
  const [saved, setSaved] = useState<Values>(initialValues);
  const [device, setDevice] = useState<"desktop" | "mobile">("mobile");

  const hexOk = HEX_PATTERN.test(values.brandColor);
  const brand = hexOk ? values.brandColor.toUpperCase() : "#6366F1";

  useEffect(() => {
    if (!state) return;
    if ("error" in state) {
      toast.error(state.error);
    } else {
      toast.success("Theme saved.");
      // Reacting to the server action's completion, not deriving state from
      // a render — the documented exception to "don't setState in effects".
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function discard() {
    setValues(saved);
    toast.info("Changes discarded.");
  }

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  return (
    <div className="flex flex-wrap items-start gap-7">
      <form
        action={formAction}
        className="flex min-w-0 flex-1 flex-col gap-6"
        style={{ flexBasis: "520px" }}
      >
        <input type="hidden" name="theme_template" value={values.template} />
        <input type="hidden" name="theme_font" value={values.font} />
        <input type="hidden" name="theme_button_style" value={values.buttonStyle} />
        <input type="hidden" name="theme_layout" value={values.layout} />
        <input type="hidden" name="brand_color" value={values.brandColor} />

        <Card
          icon={<ImageIcon className="h-5 w-5" />}
          iconBg="var(--neutral-tint)"
          iconColor="var(--neutral-text)"
          title="Page design"
          description="The overall layout and style of your public profile page."
        >
          <div
            role="radiogroup"
            aria-label="Page design"
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {THEME_TEMPLATE_OPTIONS.map((option) => (
              <OptionTile
                key={option.value}
                selected={values.template === option.value}
                onClick={() => setValues((prev) => ({ ...prev, template: option.value }))}
              >
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="text-xs text-[var(--muted)]">{option.description}</span>
              </OptionTile>
            ))}
          </div>
        </Card>

        <Card
          icon={<PaletteIcon className="h-5 w-5" />}
          iconBg="var(--success-tint)"
          iconColor="var(--success-text)"
          title="Brand color"
          description="Used for the avatar ring, backdrop and highlights on your public page."
        >
          <div role="group" aria-label="Color presets" className="flex flex-wrap items-center gap-3">
            {COLOR_PRESETS.map((hex) => {
              const on = brand === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Use color ${hex}`}
                  aria-pressed={on}
                  onClick={() => setValues((prev) => ({ ...prev, brandColor: hex }))}
                  className="h-10 w-10 rounded-full border-0 p-0 transition-transform hover:scale-110"
                  style={{
                    background: hex,
                    boxShadow: on ? `0 0 0 3px #fff, 0 0 0 5px ${hex}` : "none",
                  }}
                />
              );
            })}
            <label
              className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(var(--primary),#F59E0B,var(--success),#0EA5E9,var(--violet),var(--primary))",
              }}
              title="Custom color"
            >
              <span className="sr-only">Pick a custom color</span>
              <input
                type="color"
                value={hexOk ? values.brandColor : "#6366F1"}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, brandColor: event.target.value.toUpperCase() }))
                }
                className="sr-only"
              />
              <span className="block h-4 w-4 rounded-full bg-white" />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex min-w-[200px] flex-1 flex-col gap-2">
              <label htmlFor="t-hex" className="text-[15px] font-semibold">
                Hex code
              </label>
              <div
                className="flex items-center gap-3 rounded-[14px] border-[1.5px] bg-[var(--bg)] py-0 pr-3.5 pl-2 focus-within:border-[var(--accent)] focus-within:bg-white"
                style={{ borderColor: hexOk ? "var(--line)" : "var(--danger-ring)" }}
              >
                <span className="block h-[34px] w-[34px] shrink-0 rounded-[10px]" style={{ background: brand }} />
                <input
                  id="t-hex"
                  type="text"
                  value={values.brandColor}
                  onChange={(event) => {
                    let v = event.target.value.trim();
                    if (v && v.charAt(0) !== "#") v = `#${v}`;
                    setValues((prev) => ({ ...prev, brandColor: v.slice(0, 7) }));
                  }}
                  maxLength={7}
                  aria-invalid={!hexOk}
                  className="min-h-[50px] w-full border-0 bg-transparent font-mono font-semibold uppercase outline-none"
                />
              </div>
              {!hexOk && (
                <div role="alert" className="text-[13px] font-semibold text-[var(--danger-strong)]">
                  Enter a color like #6366F1.
                </div>
              )}
            </div>
            <div className="flex min-w-[200px] flex-1 flex-col gap-2">
              <span className="text-[15px] font-semibold">How it looks</span>
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex min-h-11 items-center rounded-full px-5 font-bold text-white"
                  style={{ background: brand }}
                >
                  Button
                </span>
                <span
                  className="inline-flex min-h-11 items-center rounded-full px-4.5 font-bold text-[var(--ink)]"
                  style={{ background: `color-mix(in srgb, ${brand} 18%, white)` }}
                >
                  Highlight
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card
          icon={<PencilIcon className="h-5 w-5" />}
          iconBg="var(--tint)"
          iconColor="var(--accent)"
          title="Font"
          description="The typeface used for your name, bio, and links."
        >
          <div role="radiogroup" aria-label="Font" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {THEME_FONT_OPTIONS.map((option) => (
              <OptionTile
                key={option.value}
                selected={values.font === option.value}
                onClick={() => setValues((prev) => ({ ...prev, font: option.value }))}
              >
                <span className={`text-xl ${option.sampleClass}`}>Aa</span>
                <span className="text-sm font-semibold">{option.label}</span>
              </OptionTile>
            ))}
          </div>
        </Card>

        <Card
          icon={<LayersIcon className="h-5 w-5" />}
          iconBg="var(--tint2)"
          iconColor="var(--violet)"
          title="Button style"
          description="The shape of your link buttons."
        >
          <div
            role="radiogroup"
            aria-label="Button style"
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {THEME_BUTTON_STYLE_OPTIONS.map((option) => (
              <OptionTile
                key={option.value}
                selected={values.buttonStyle === option.value}
                onClick={() => setValues((prev) => ({ ...prev, buttonStyle: option.value }))}
              >
                <span
                  className={`block h-6 w-full border-[1.5px] border-[var(--ink)]/20 bg-[var(--ink)]/5 ${option.radiusClass}`}
                />
                <span className="text-sm font-semibold">{option.label}</span>
              </OptionTile>
            ))}
          </div>
        </Card>

        {state && "error" in state && (
          <p
            role="alert"
            className="rounded-2xl border-[1.5px] px-4 py-3 text-sm font-semibold"
            style={{ borderColor: "var(--danger-ring)", background: "var(--danger-tint)", color: "var(--danger-strong)" }}
          >
            {state.error}
          </p>
        )}

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
                {pending ? "Saving…" : "Save theme"}
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

      <aside
        className="flex min-w-[300px] flex-col gap-4"
        style={{ flex: "0 1 420px" }}
        aria-label="Live preview"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div
              className={`flex items-center gap-2 ${displayFont} text-[22px] font-extrabold tracking-[-0.02em]`}
            >
              <span className="animate-pulse-soft h-2 w-2 rounded-full bg-[var(--success)]" />
              Live preview
            </div>
            <div className="text-sm text-[var(--muted)]">Updates as you pick.</div>
          </div>
          <div
            role="group"
            aria-label="Preview device"
            className="inline-flex rounded-full border-[1.5px] border-[var(--line)] bg-white p-1"
          >
            <button
              type="button"
              aria-label="Mobile preview"
              aria-pressed={device === "mobile"}
              onClick={() => setDevice("mobile")}
              className="flex h-[38px] w-11 items-center justify-center rounded-full border-0"
              style={{
                background: device === "mobile" ? "var(--ink)" : "transparent",
                color: device === "mobile" ? "#fff" : "var(--muted)",
              }}
            >
              <MobileIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              aria-label="Desktop preview"
              aria-pressed={device === "desktop"}
              onClick={() => setDevice("desktop")}
              className="flex h-[38px] w-11 items-center justify-center rounded-full border-0"
              style={{
                background: device === "desktop" ? "var(--ink)" : "transparent",
                color: device === "desktop" ? "#fff" : "var(--muted)",
              }}
            >
              <DesktopIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            className="relative flex flex-col overflow-hidden bg-white shadow-[0_40px_70px_-34px_color-mix(in srgb, var(--ink) 50%, transparent)] transition-[width,height,border-radius]"
            style={
              device === "mobile"
                ? { width: 300, height: 600, borderRadius: 42, border: "8px solid var(--ink)" }
                : {
                    width: "100%",
                    height: 470,
                    borderRadius: 18,
                    border: "1.5px solid var(--line)",
                  }
            }
          >
            {device === "desktop" && (
              <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--line)] bg-[var(--secondary-soft-bg)] px-3.5 py-2.5">
                <span className="inline-flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF9DB8]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F5D27A]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8EDDB9]" />
                </span>
                <span className="min-w-0 flex-1 truncate rounded-full bg-white px-3 py-1 text-xs text-[var(--muted)]">
                  {profile.username
                    ? `insta-auto-dm-xi.vercel.app/${profile.username}`
                    : "insta-auto-dm-xi.vercel.app/username"}
                </span>
              </div>
            )}
            <div
              className="min-h-0 flex-1 overflow-y-auto p-4"
              style={{
                background: `linear-gradient(165deg, color-mix(in srgb, ${brand} 12%, white) 0%, color-mix(in srgb, ${brand} 38%, white) 100%)`,
              }}
            >
              <LinkInBioPreview
                brandColor={brand}
                avatarUrl={profile.avatar_url}
                displayName={profile.display_name}
                username={profile.username}
                bio={profile.bio}
                links={previewLinks}
                themeFont={values.font}
                buttonStyle={values.buttonStyle}
                layout={values.layout}
                template={values.template}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function OptionTile({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 rounded-2xl border-[1.5px] px-4 py-4 text-center transition-colors"
      style={{
        borderColor: selected ? "var(--accent)" : "var(--line)",
        background: selected ? "var(--tint)" : "var(--bg)",
      }}
    >
      {children}
    </button>
  );
}

function Card({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-[32px] border-[1.5px] border-[var(--line)] bg-white p-7">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[13px]"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </span>
        <div>
          <h2 className={`m-0 ${displayFont} text-2xl font-extrabold tracking-[-0.02em]`}>
            {title}
          </h2>
          <div className="text-sm text-[var(--muted)]">{description}</div>
        </div>
      </div>
      {children}
    </section>
  );
}
