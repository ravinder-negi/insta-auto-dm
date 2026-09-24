import type { ThemeButtonStyle, ThemeFont, ThemeLayout } from "@/lib/types";

export const THEME_FONT_OPTIONS: { value: ThemeFont; label: string; sampleClass: string }[] = [
  { value: "sans", label: "Sans", sampleClass: "font-sans" },
  { value: "serif", label: "Serif", sampleClass: "font-serif" },
  { value: "mono", label: "Mono", sampleClass: "font-mono" },
];

export const THEME_BUTTON_STYLE_OPTIONS: {
  value: ThemeButtonStyle;
  label: string;
  radiusClass: string;
}[] = [
  { value: "pill", label: "Pill", radiusClass: "rounded-full" },
  { value: "rounded", label: "Rounded", radiusClass: "rounded-2xl" },
  { value: "square", label: "Square", radiusClass: "rounded-md" },
];

export const THEME_LAYOUT_OPTIONS: { value: ThemeLayout; label: string }[] = [
  { value: "center", label: "Centered" },
  { value: "left", label: "Left-aligned" },
];

export function getThemeFontClassName(font: ThemeFont): string {
  return THEME_FONT_OPTIONS.find((option) => option.value === font)?.sampleClass ?? "font-sans";
}

export function getButtonRadiusClass(style: ThemeButtonStyle): string {
  return (
    THEME_BUTTON_STYLE_OPTIONS.find((option) => option.value === style)?.radiusClass ??
    "rounded-2xl"
  );
}
