import { ACCENT_COLOR_OPTIONS } from "./accentColors";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }

  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let [r, g, b] = [0, 0, 0];
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Three diagonal-gradient stops derived from a single accent color, in the
 *  same hue-sweep/lightness-dip shape as the original hand-picked brand
 *  gradient (indigo -> violet -> purple). Fallback only, for a hex that
 *  doesn't match a curated ACCENT_COLOR_OPTIONS preset — the formula produces
 *  muddy mids for some hues (amber, teal), which is why presets carry their
 *  own hand-picked stops instead of relying on this. */
export function buildBrandGradientStops(baseHex: string): {
  from: string;
  via: string;
  to: string;
} {
  const { h, s, l } = hexToHsl(baseHex);
  return {
    from: hslToHex(h - 4, s - 5, l - 1),
    via: hslToHex(h + 19, s - 6, l - 10),
    to: hslToHex(h + 29, s + 2, l - 3),
  };
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
export const DEFAULT_ACCENT = "#6d5ef6";

/** All --color-brand-* custom properties (shade ramp + gradient stops) for a
 *  given accent color. Used both to override them globally (app/layout.tsx)
 *  and to preview them scoped to one element (admin appearance page). */
export function buildBrandCssVars(accent: string): Record<string, string> {
  const base = HEX_COLOR.test(accent) ? accent : DEFAULT_ACCENT;
  const preset = ACCENT_COLOR_OPTIONS.find(
    (option) => option.value.toLowerCase() === base.toLowerCase()
  );
  const { from, via, to } = preset ?? buildBrandGradientStops(base);

  return {
    "--color-brand-50": `color-mix(in srgb, ${base} 8%, white)`,
    "--color-brand-100": `color-mix(in srgb, ${base} 15%, white)`,
    "--color-brand-200": `color-mix(in srgb, ${base} 30%, white)`,
    "--color-brand-300": `color-mix(in srgb, ${base} 50%, white)`,
    "--color-brand-400": `color-mix(in srgb, ${base} 75%, white)`,
    "--color-brand-500": base,
    "--color-brand-600": `color-mix(in srgb, ${base} 88%, black)`,
    "--color-brand-700": `color-mix(in srgb, ${base} 72%, black)`,
    "--color-brand-800": `color-mix(in srgb, ${base} 58%, black)`,
    "--color-brand-900": `color-mix(in srgb, ${base} 45%, black)`,
    "--color-brand-gradient-from": from,
    "--color-brand-gradient-via": via,
    "--color-brand-gradient-to": to,
  };
}
