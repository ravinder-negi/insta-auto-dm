import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

// Shared design system for the Link-in-bio dashboard pages (Creator profile,
// Social accounts, …) — see "Creator profile-html/CreatorProfile.dc.html".
// Scoped to these routes via CSS variables rather than app/fonts.ts so the
// rest of the dashboard keeps its own typefaces.

export const linkInBioDisplayFont = Bricolage_Grotesque({
  variable: "--font-libio-display",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const linkInBioBodyFont = DM_Sans({
  variable: "--font-libio-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const linkInBioFontVariables = `${linkInBioDisplayFont.variable} ${linkInBioBodyFont.variable}`;

// Arbitrary-property utility: Tailwind has no built-in utility for an
// arbitrary font-family, so this is applied as a class directly.
export const displayFont = "[font-family:var(--font-libio-display)]";

// --ink/--muted/--line/--violet come straight from the global palette on
// :root (app/globals.css) via normal inheritance; --accent is kept as a
// local alias since most of this design's markup was written against that
// name (self-referencing "--violet: var(--violet)" here would be a CSS
// cycle — omit it and let it inherit instead). No participation in the
// app's dark mode or admin-set accent color, same approach as the marketing
// home page.
export const linkInBioCssVars = {
  "--accent": "var(--primary)",
} as React.CSSProperties;

export const linkInBioWrapperClass = `${linkInBioFontVariables} w-full text-[16px] leading-[1.5] text-[var(--ink)] [font-family:var(--font-libio-body),system-ui,sans-serif]`;

/** Status-dependent accent used across product/lead-magnet cards — green for
 *  live, muted violet-gray for hidden. Matches the Products/Lead magnets
 *  mockups' status chips, badges, and toggle tracks. */
export const linkInBioStatus = {
  active: { label: "Active", bg: "var(--success-tint)", fg: "var(--success-text)", dot: "var(--success)" },
  hidden: { label: "Hidden", bg: "var(--neutral-tint)", fg: "var(--neutral-text)", dot: "var(--neutral-dot)" },
} as const;

/** Deterministic gradient fallback for product/lead-magnet thumbnails that
 *  have no uploaded image, cycling by id so it doesn't shift on reorder. */
const LINK_IN_BIO_GRADIENTS = [
  "linear-gradient(135deg,var(--violet) 0%,var(--primary) 100%)",
  "linear-gradient(135deg,#0B7A5C 0%,var(--violet) 100%)",
  "linear-gradient(135deg,#F59E0B 0%,var(--primary) 100%)",
  "linear-gradient(135deg,#0EA5E9 0%,var(--violet) 100%)",
];

export function linkInBioGradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return LINK_IN_BIO_GRADIENTS[hash % LINK_IN_BIO_GRADIENTS.length];
}
