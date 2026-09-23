import { Lora } from "next/font/google";

// Geist Sans/Mono are already loaded globally in app/layout.tsx and exposed
// as Tailwind's font-sans/font-mono; only the serif option needs its own
// next/font instance.
export const serifFont = Lora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});
