import type { Metadata } from "next";
import Script from "next/script";
import { fontVariables } from "./fonts";
import { createClient } from "@/lib/supabase/server";
import { buildBrandCssVars, DEFAULT_ACCENT } from "@/lib/utils/color";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insta Auto DM",
  description: "Automatically DM Instagram commenters who use a keyword.",
};

// Re-applies an explicit theme choice before paint. The toggle only exists
// post-login, so this only ever targets `.dashboard-theme` (DashboardShell's
// root) — on marketing/auth pages that element doesn't exist and the script
// is a no-op, which keeps those pages on the light defaults always.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){var el=document.querySelector(".dashboard-theme");if(el)el.classList.add(t)}}catch(e){}`;

/** Overrides the --color-brand-* defaults in globals.css with the
 *  app's configured accent color — see src/lib/utils/color.ts. */
function brandRampStyle(accent: string) {
  const vars = buildBrandCssVars(accent);
  const declarations = Object.entries(vars)
    .map(([name, value]) => `${name}: ${value};`)
    .join("\n");
  return `:root{${declarations}}`;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("accent_color")
    .eq("id", 1)
    .maybeSingle<{ accent_color: string }>();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <style
          id="brand-color"
          dangerouslySetInnerHTML={{
            __html: brandRampStyle(settings?.accent_color ?? DEFAULT_ACCENT),
          }}
        />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
