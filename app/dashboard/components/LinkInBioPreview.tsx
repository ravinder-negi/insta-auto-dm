import { Avatar } from "./Avatar";
import { ChevronDownIcon } from "./icons";
import { resolveLinkVisual } from "../links/linkTypeIcons";
import { getButtonRadiusClass, getThemeFontClassName } from "../theme/themeOptions";
import type { LinkIconKey, LinkType, ThemeButtonStyle, ThemeFont, ThemeLayout } from "@/lib/types";

export interface PreviewLink {
  id: string;
  title: string;
  subtitle?: string | null;
  link_type: LinkType;
  icon: LinkIconKey | null;
  custom_icon_url: string | null;
  is_featured?: boolean;
}

/** The gradient profile card shown across Creator profile, Links, and the
 *  link form — a live render of what a visitor sees on the public page. */
export function LinkInBioPreview({
  brandColor,
  avatarUrl,
  displayName,
  username,
  bio,
  links,
  bezel = false,
  themeFont = "sans",
  buttonStyle = "rounded",
  layout = "center",
}: {
  brandColor: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  bio?: string | null;
  links: PreviewLink[];
  bezel?: boolean;
  themeFont?: ThemeFont;
  buttonStyle?: ThemeButtonStyle;
  layout?: ThemeLayout;
}) {
  const fontClassName = getThemeFontClassName(themeFont);
  const buttonRadiusClass = getButtonRadiusClass(buttonStyle);
  const isLeftAligned = layout === "left";

  return (
    <div
      className={
        bezel
          ? "rounded-[2.5rem] border-8 border-zinc-900 p-1 dark:border-zinc-700"
          : ""
      }
    >
      <div
        className={`relative overflow-hidden rounded-3xl p-6 shadow-inner ${fontClassName} ${
          isLeftAligned ? "text-left" : "text-center"
        }`}
        style={{
          background: `linear-gradient(135deg, ${brandColor}26, ${brandColor}4d)`,
        }}
      >
        <div className={`flex flex-col ${isLeftAligned ? "items-start" : "items-center"}`}>
          <div className="rounded-full bg-white p-1 shadow dark:bg-zinc-900">
            <Avatar name={displayName || username || "?"} src={avatarUrl} size="lg" />
          </div>
          <h3 className="mt-3 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {displayName || "Your name"}
          </h3>
          {username && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">@{username}</p>
          )}
          {bio && (
            <p className="mt-2 text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-300">
              {bio}
            </p>
          )}
        </div>

        {links.length > 0 && (
          <div className="mt-5 flex flex-col gap-2.5">
            {links.map((link) => {
              const { customImageUrl, Icon, softBackground, accent } = resolveLinkVisual(
                link,
                brandColor
              );
              return (
                <div
                  key={link.id}
                  className={`flex items-center gap-3 bg-white px-4 py-3 text-left shadow-sm dark:bg-zinc-900 ${buttonRadiusClass}`}
                  style={
                    link.is_featured ? { borderLeft: `4px solid ${brandColor}` } : undefined
                  }
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                    style={{ background: softBackground, color: accent }}
                  >
                    {customImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
                      <img
                        src={customImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {link.title}
                    </span>
                    {link.subtitle && (
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {link.subtitle}
                      </span>
                    )}
                  </span>
                  {link.is_featured && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      Featured
                    </span>
                  )}
                  <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 -rotate-90 text-zinc-400" />
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-xs text-zinc-400">Made with ⚡ Auto DM</p>
      </div>
    </div>
  );
}
