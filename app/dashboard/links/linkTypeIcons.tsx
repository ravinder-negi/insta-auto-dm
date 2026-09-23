import {
  DocumentIcon,
  GlobeIcon,
  InstagramIcon,
  LinkIcon,
  MailIcon,
  ReceiptIcon,
  YoutubeIcon,
} from "../components/icons";
import type { LinkIconKey, LinkType, ProfileLink } from "@/lib/types";

export const LINK_TYPE_ICONS: Record<LinkType, typeof GlobeIcon> = {
  website: GlobeIcon,
  youtube: YoutubeIcon,
  blog: DocumentIcon,
  product: ReceiptIcon,
  custom: LinkIcon,
};

/** Platform-authentic badge color, where one exists. Falls back to the
 *  profile's brand color for types with no fixed brand (website/blog/product/custom). */
export const LINK_TYPE_COLORS: Partial<Record<LinkType, string>> = {
  youtube: "#FF0000",
};

/** Selectable display icons, independent of `link_type` (the "Icon" picker on the link form). */
export const ICON_OPTIONS: { value: LinkIconKey; label: string; icon: typeof GlobeIcon }[] = [
  { value: "link", label: "Link", icon: LinkIcon },
  { value: "youtube", label: "YouTube", icon: YoutubeIcon },
  { value: "instagram", label: "Instagram", icon: InstagramIcon },
  { value: "globe", label: "Website", icon: GlobeIcon },
  { value: "mail", label: "Email", icon: MailIcon },
];

const ICON_KEY_COMPONENTS: Record<LinkIconKey, typeof GlobeIcon> = {
  link: LinkIcon,
  youtube: YoutubeIcon,
  instagram: InstagramIcon,
  globe: GlobeIcon,
  mail: MailIcon,
  custom: LinkIcon,
};

const ICON_KEY_BACKGROUNDS: Partial<Record<LinkIconKey, string>> = {
  youtube: "#FF0000",
  instagram: "linear-gradient(45deg, #f58529, #dd2a7b, #8134af, #515bd4)",
};

/** Flat color used for the glyph itself, and to tint its tile on the public page. */
const ICON_KEY_ACCENTS: Partial<Record<LinkIconKey, string>> = {
  youtube: "#FF0000",
  instagram: "#DD2A7B",
  mail: "#3B82F6",
};

const LINK_TYPE_ACCENTS: Partial<Record<LinkType, string>> = {
  youtube: "#FF0000",
};

export interface LinkVisual {
  customImageUrl: string | null;
  Icon: typeof GlobeIcon;
  /** Saturated fill — white glyph on top (dashboard rows). */
  background: string;
  /** Pale wash of the accent — colored glyph on top (public page + preview). */
  softBackground: string;
  /** Glyph color when sitting on `softBackground`. */
  accent: string;
}

/** Resolves what to render for a link's badge: a custom uploaded image, or an
 *  icon component + background — from `icon` when set, else derived from `link_type`. */
export function resolveLinkVisual(
  link: Pick<ProfileLink, "icon" | "link_type" | "custom_icon_url">,
  brandColor: string
): LinkVisual {
  if (link.icon === "custom" && link.custom_icon_url) {
    return {
      customImageUrl: link.custom_icon_url,
      Icon: LinkIcon,
      background: brandColor,
      softBackground: `${brandColor}1f`,
      accent: brandColor,
    };
  }

  const accent = link.icon
    ? (ICON_KEY_ACCENTS[link.icon] ?? brandColor)
    : (LINK_TYPE_ACCENTS[link.link_type] ?? brandColor);

  return {
    customImageUrl: null,
    Icon: link.icon ? ICON_KEY_COMPONENTS[link.icon] : LINK_TYPE_ICONS[link.link_type],
    background: link.icon
      ? (ICON_KEY_BACKGROUNDS[link.icon] ?? brandColor)
      : (LINK_TYPE_COLORS[link.link_type] ?? brandColor),
    softBackground: `${accent}1f`,
    accent,
  };
}
