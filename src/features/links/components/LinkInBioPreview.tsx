import { Avatar } from "@/components/ui/Avatar";
import { ChevronDownIcon } from "@/components/icons";
import { resolveLinkVisual } from "@/features/links/linkTypeIcons";
import { getButtonRadiusClass, getThemeFontClassName } from "@/features/theme/themeOptions";
import { linkInBioCssVars } from "@/lib/linkInBioTheme";
import type {
  LinkIconKey,
  LinkType,
  ThemeButtonStyle,
  ThemeFont,
  ThemeLayout,
  ThemeTemplate,
} from "@/types";

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
  template = "original",
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
  template?: ThemeTemplate;
}) {
  const fontClassName = getThemeFontClassName(themeFont);
  const buttonRadiusClass = getButtonRadiusClass(buttonStyle);
  const isLeftAligned = layout === "left";
  const isNoir = template === "noir";
  const isCentered = template === "centered";

  const cardStyle: React.CSSProperties = isNoir
    ? { background: "#0E0D14" }
    : isCentered
      ? { background: `color-mix(in srgb, ${brandColor} 10%, white)` }
      : { background: `linear-gradient(135deg, ${brandColor}26, ${brandColor}4d)` };

  const inkClass = isNoir ? "text-white" : "text-[var(--ink)]";
  const mutedClass = isNoir ? "text-[#A9A5BA]" : "text-[var(--muted)]";
  const rowClass = isNoir
    ? "bg-white/[0.08] border border-white/10"
    : "bg-white shadow-sm";

  return (
    <div
      style={linkInBioCssVars}
      className={bezel ? "rounded-[2.5rem] border-8 border-[var(--ink)] p-1" : ""}
    >
      <div
        className={`relative overflow-hidden rounded-[28px] p-7 ${
          isNoir ? "" : "shadow-[0_30px_60px_-30px_rgba(21,19,28,0.35)]"
        } ${fontClassName} ${isLeftAligned ? "text-left" : "text-center"}`}
        style={cardStyle}
      >
        {isCentered && (
          <div
            className="absolute inset-x-0 top-0 h-16 rounded-t-[28px]"
            style={{ background: `linear-gradient(135deg, ${brandColor}, color-mix(in srgb, ${brandColor} 70%, black))` }}
          />
        )}
        <div
          className={`relative flex flex-col ${isLeftAligned ? "items-start" : "items-center"} ${
            isCentered ? "mt-6" : ""
          }`}
        >
          <div className="rounded-full bg-white p-1 shadow-[0_6px_16px_-4px_rgba(21,19,28,0.25)]">
            <Avatar name={displayName || username || "?"} src={avatarUrl} size="xl" />
          </div>
          <h3 className={`mt-4 text-xl font-extrabold tracking-tight ${inkClass}`}>
            {displayName || "Your name"}
          </h3>
          {username && (
            <p className={`mt-0.5 text-sm font-medium ${mutedClass}`}>@{username}</p>
          )}
          {bio && (
            <p
              className={`mt-3 line-clamp-3 max-w-[240px] text-sm leading-relaxed whitespace-pre-line ${mutedClass} ${
                isLeftAligned ? "" : "mx-auto"
              }`}
            >
              {bio}
            </p>
          )}
        </div>

        {links.length > 0 && (
          <div className="relative mt-6 flex flex-col gap-2.5">
            {links.map((link) => {
              const { customImageUrl, Icon, softBackground, accent } = resolveLinkVisual(
                link,
                brandColor
              );
              return (
                <div
                  key={link.id}
                  className={`flex items-center gap-3 px-4 py-3.5 text-left ${rowClass} ${buttonRadiusClass}`}
                  style={
                    link.is_featured ? { borderLeft: `4px solid ${brandColor}` } : undefined
                  }
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
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
                      <Icon className="h-[18px] w-[18px]" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-semibold ${inkClass}`}>
                      {link.title}
                    </span>
                    {link.subtitle && (
                      <span className={`block truncate text-xs ${mutedClass}`}>
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
                  <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 -rotate-90 ${mutedClass}`} />
                </div>
              );
            })}
          </div>
        )}

        <p className={`relative mt-7 text-[11px] opacity-70 ${mutedClass}`}>
          Made with ⚡ Auto DM
        </p>
      </div>
    </div>
  );
}
