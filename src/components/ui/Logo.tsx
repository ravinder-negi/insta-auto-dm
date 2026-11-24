import Image from "next/image";

/** Intrinsic size of the wordmark PNGs — keeps the aspect ratio (≈2.46:1). */
const LOGO_WIDTH = 1446;
const LOGO_HEIGHT = 587;

const LOGO_SRC = {
  /** Near-black "Link" lettering — for light backgrounds. */
  dark: "/dm_logo.png",
  /** White "Link" lettering — for dark backgrounds (sidebar, dark panels). */
  light: "/dm_logo_light.png",
} as const;

type LogoProps = {
  /** Tailwind height class; width follows the aspect ratio. */
  className?: string;
  /** Set on above-the-fold usages (headers) so the image is preloaded. */
  preload?: boolean;
  /** "dark" text for light surfaces (default), "light" text for dark surfaces. */
  variant?: keyof typeof LOGO_SRC;
};

/** Full DMLink wordmark (icon + text). */
export function Logo({ className = "h-9", preload = false, variant = "dark" }: LogoProps) {
  return (
    <Image
      src={LOGO_SRC[variant]}
      alt="DMLink"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      preload={preload}
      className={`w-auto ${className}`}
    />
  );
}
