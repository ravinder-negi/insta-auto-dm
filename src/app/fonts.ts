import { Geist_Mono, Lora, Plus_Jakarta_Sans } from "next/font/google";

// Single source of truth for the app's typefaces. To swap a font, change the
// import and the constructor below — keep the `variable` names as they are.
// globals.css maps these variables to Tailwind's font-sans / font-mono /
// font-serif, so nothing else in the project references a font by name.

export const sansFont = Plus_Jakarta_Sans({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

export const monoFont = Geist_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
});

export const serifFont = Lora({
  variable: "--font-app-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Applied once on <html> in app/layout.tsx.
export const fontVariables = [sansFont.variable, monoFont.variable, serifFont.variable].join(" ");
