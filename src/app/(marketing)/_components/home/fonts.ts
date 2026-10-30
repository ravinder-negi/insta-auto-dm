import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

// Fonts for the home page design only — see Home page-html/Main.dc.html.
// Scoped to this route via CSS variables rather than app/fonts.ts so the
// rest of the app keeps its own typefaces.

export const homeDisplayFont = Bricolage_Grotesque({
  variable: "--font-home-display",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const homeBodyFont = DM_Sans({
  variable: "--font-home-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const homeFontVariables = `${homeDisplayFont.variable} ${homeBodyFont.variable}`;

// Arbitrary-property utility: Tailwind has no built-in utility for an
// arbitrary font-family, so this is applied as a class directly.
export const displayFont = "[font-family:var(--font-home-display)]";

// Shared wrapper for every page that uses the home design (marketing home,
// legal pages, contact) — see Home page-html/Main.dc.html. --ink/--muted/
// --line/--violet come straight from the global palette on :root
// (app/globals.css) via normal inheritance; --accent is kept as a local
// alias since most of this design's markup was written against that name
// (self-referencing "--violet: var(--violet)" here would be a CSS cycle —
// omit it and let it inherit instead).
export const homeCssVars = {
  "--accent": "var(--primary)",
} as React.CSSProperties;

export const homeWrapperClass = `${homeFontVariables} w-full bg-[var(--bg)] text-[17px] leading-[1.55] text-[var(--ink)] [font-family:var(--font-home-body),system-ui,sans-serif]`;
