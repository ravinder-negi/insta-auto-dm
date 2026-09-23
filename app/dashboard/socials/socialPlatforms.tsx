import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  TikTokIcon,
  XIcon,
  YoutubeIcon,
} from "../components/icons";
import type { SocialPlatform } from "@/lib/types";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "youtube",
  "facebook",
  "x",
  "tiktok",
  "linkedin",
  "email",
];

const HTTP_URL = /^https?:\/\/\S+$/;
export const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SOCIAL_PLATFORM_META: Record<
  SocialPlatform,
  {
    label: string;
    icon: typeof GlobeIcon;
    background: string;
    /** Glyph color on the public page; defaults to white for filled badges. */
    foreground?: string;
    placeholder: string;
    /** Native input type — "email" skips the browser's URL-scheme validation. */
    inputType: "url" | "email";
    urlPattern: RegExp;
    urlHint: string;
  }
> = {
  instagram: {
    label: "Instagram",
    icon: InstagramIcon,
    background: "linear-gradient(45deg, #f58529, #dd2a7b, #8134af, #515bd4)",
    placeholder: "https://instagram.com/yourname",
    inputType: "url",
    urlPattern: HTTP_URL,
    urlHint: "must be a valid http:// or https:// URL",
  },
  youtube: {
    label: "YouTube",
    icon: YoutubeIcon,
    background: "#FF0000",
    placeholder: "https://youtube.com/@yourname",
    inputType: "url",
    urlPattern: HTTP_URL,
    urlHint: "must be a valid http:// or https:// URL",
  },
  facebook: {
    label: "Facebook",
    icon: FacebookIcon,
    background: "#1877F2",
    placeholder: "https://facebook.com/yourname",
    inputType: "url",
    urlPattern: HTTP_URL,
    urlHint: "must be a valid http:// or https:// URL",
  },
  x: {
    label: "X",
    icon: XIcon,
    background: "#000000",
    placeholder: "https://x.com/yourname",
    inputType: "url",
    urlPattern: HTTP_URL,
    urlHint: "must be a valid http:// or https:// URL",
  },
  tiktok: {
    label: "TikTok",
    icon: TikTokIcon,
    background: "#000000",
    placeholder: "https://tiktok.com/@yourname",
    inputType: "url",
    urlPattern: HTTP_URL,
    urlHint: "must be a valid http:// or https:// URL",
  },
  linkedin: {
    label: "LinkedIn",
    icon: LinkedInIcon,
    background: "#0A66C2",
    placeholder: "https://linkedin.com/in/yourname",
    inputType: "url",
    urlPattern: HTTP_URL,
    urlHint: "must be a valid http:// or https:// URL",
  },
  email: {
    label: "Email",
    icon: MailIcon,
    background: "#FFFFFF",
    foreground: "#52525B",
    placeholder: "you@example.com",
    inputType: "email",
    urlPattern: EMAIL_ADDRESS,
    urlHint: "must be a valid email address",
  },
};
