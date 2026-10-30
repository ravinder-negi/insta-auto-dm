import { ArrowRightIcon, BoltIcon } from "@/components/icons";
import { resolveLinkVisual } from "@/features/links/linkTypeIcons";
import { SOCIAL_PLATFORM_META } from "@/features/socials/socialPlatforms";
import { getButtonRadiusClass, getThemeFontClassName } from "@/features/theme/themeOptions";
import { linkInBioCssVars } from "@/lib/linkInBioTheme";
import { LeadMagnetCard } from "../LeadMagnetCard";
import { ProductCard } from "../ProductCard";
import { ShareButton } from "../ShareButton";
import { TrackedLink } from "../TrackedLink";
import type { ProfileTemplateProps } from "./types";

export function OriginalTemplate({
  profile,
  links,
  socials,
  leadMagnets,
  products,
}: ProfileTemplateProps) {
  const brandColor = profile.brand_color || "#6366f1";
  const fontClassName = getThemeFontClassName(profile.theme_font);
  const buttonRadiusClass = getButtonRadiusClass(profile.theme_button_style);
  const isLeftAligned = profile.theme_layout === "left";
  // Text-align only (not flex align-items): a flex column's non-stretch
  // align-items shrink-fits each child to its own intrinsic width, which lets
  // a flex-wrap row (the socials list) overflow its box instead of wrapping —
  // staying full-width and centering via text-align avoids that entirely.
  const sidebarAlignClass = isLeftAligned ? "text-left" : "text-center lg:text-left";

  const tabs = [
    links.length > 0 ? { id: "links", label: "Links" } : null,
    leadMagnets.length > 0 ? { id: "free", label: "Free resources" } : null,
    products.length > 0 ? { id: "shop", label: "Shop" } : null,
  ].filter((tab): tab is { id: string; label: string } => tab !== null);

  return (
    <main
      className={`relative min-h-screen overflow-x-clip bg-[var(--bg)] px-5 py-10 sm:px-6 lg:px-10 lg:py-14 ${fontClassName}`}
      style={{ ...linkInBioCssVars, "--brand-color": brandColor } as React.CSSProperties}
    >
      {/* decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1.2px, transparent 1.2px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div
          className="absolute -top-36 -left-28 h-[28rem] w-[28rem] rounded-full opacity-[0.28] blur-[100px] motion-safe:animate-[pp-drift-1_14s_ease-in-out_infinite]"
          style={{ backgroundColor: "var(--brand-color)" }}
        />
        <div className="absolute top-[28%] -right-32 h-[26rem] w-[26rem] rounded-full bg-[#ffb3cb] opacity-[0.35] blur-[100px] motion-safe:animate-[pp-drift-2_17s_ease-in-out_infinite]" />
        <div
          className="absolute top-36 right-[10%] hidden h-6 w-6 rounded-full opacity-30 motion-safe:animate-[pp-bob_5s_ease-in-out_infinite] lg:block"
          style={{ backgroundColor: "var(--brand-color)" }}
        />
        <div
          className="absolute top-[45%] left-[4%] hidden h-4 w-4 rounded-full opacity-30 motion-safe:animate-[pp-bob_6.5s_ease-in-out_-2s_infinite] lg:block"
          style={{ backgroundColor: "var(--brand-color)" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1180px] justify-end">
        <ShareButton title={profile.display_name || `@${profile.username}`} brandColor={brandColor} />
      </div>

      <div className="relative z-[1] mx-auto mt-6 flex w-full max-w-[1180px] flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        {/* LEFT: PROFILE */}
        <header
          className={`flex w-full flex-col gap-4 lg:sticky lg:top-8 lg:w-80 lg:shrink-0 ${sidebarAlignClass}`}
        >
          <div
            className={`relative h-36 w-36 lg:h-40 lg:w-40 ${isLeftAligned ? "" : "mx-auto lg:mx-0"}`}
          >

            <span
              className="absolute inset-0 rounded-full motion-safe:animate-[pp-spin_9s_linear_infinite]"
              style={{
                background:
                  "conic-gradient(var(--brand-color), #ff7aa2, #fff, var(--brand-color))",
              }}
            />
            <span className="absolute inset-[5px] rounded-full bg-white p-[5px]">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? profile.username ?? ""}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center rounded-full font-display text-5xl font-extrabold text-white"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, var(--brand-color), color-mix(in srgb, var(--brand-color) 72%, black))",
                  }}
                >
                  {(profile.display_name || profile.username || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
            </span>
          </div>

          <div>
            <h1 className="m-0 font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-none font-extrabold tracking-tight text-[var(--ink)]">
              {profile.display_name || `@${profile.username}`}
            </h1>
            <span className="mt-2.5 inline-block rounded-full border border-black/10 bg-white/75 px-3.5 py-1 text-sm font-semibold text-[var(--muted)]">
              @{profile.username}
            </span>
          </div>

          {profile.bio && (
            <p
              className={`max-w-[340px] text-[17px] leading-relaxed whitespace-pre-line text-[var(--muted)] ${isLeftAligned ? "" : "mx-auto lg:mx-0"}`}
            >
              {profile.bio}
            </p>
          )}

          {socials.length > 0 && (
            <div
              className={`flex w-full flex-wrap gap-3 ${isLeftAligned ? "justify-start" : "justify-center lg:justify-start"}`}
              role="list"
              aria-label="Social links"
            >
              {socials.map((social) => {
                const meta = SOCIAL_PLATFORM_META[social.platform];
                const Icon = meta.icon;
                return (
                  <TrackedLink
                    key={social.id}
                    profileId={profile.id}
                    targetType="social"
                    targetId={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="listitem"
                    aria-label={meta.label}
                    className="group relative flex h-12 w-12 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-6deg] hover:scale-105"
                    style={{ background: meta.background, color: meta.foreground ?? "#ffffff" }}
                  >
                    <Icon className="h-5 w-5" />
                    <span
                      className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-[var(--ink)] px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      {meta.label}
                    </span>
                  </TrackedLink>
                );
              })}
            </div>
          )}
        </header>

        {/* RIGHT: CONTENT */}
        <div className="flex min-w-0 flex-1 flex-col gap-11">
          {tabs.length > 1 && (
            <nav
              aria-label="Sections"
              className="sticky top-4 z-[5] flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-black/10 bg-white/80 p-1.5 shadow-[0_12px_26px_-18px_color-mix(in srgb, var(--ink) 50%, transparent)] backdrop-blur-md"
            >
              {tabs.map((tab) => (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-full px-5 text-[15px] font-bold whitespace-nowrap text-[var(--ink)] transition-colors hover:bg-[var(--brand-color)] hover:text-white"
                >
                  {tab.label}
                </a>
              ))}
            </nav>
          )}

          {/* LINKS */}
          {links.length > 0 && (
            <section id="links" aria-labelledby="h-links" className="flex scroll-mt-24 flex-col gap-3.5">
              <h2
                id="h-links"
                className="m-0 mb-1 font-display text-[28px] font-extrabold tracking-tight text-[var(--ink)] sm:text-[30px]"
              >
                Links
              </h2>
              {links.map((link) => {
                const { customImageUrl, Icon, softBackground, accent } = resolveLinkVisual(
                  link,
                  brandColor
                );
                return (
                  <TrackedLink
                    key={link.id}
                    profileId={profile.id}
                    targetType="profile_link"
                    targetId={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-4 border border-black/5 bg-white px-5 py-4 text-left shadow-[0_14px_30px_-24px_color-mix(in srgb, var(--ink) 50%, transparent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-26px_var(--brand-color)] active:translate-y-0 ${buttonRadiusClass}`}
                    style={
                      link.is_featured
                        ? {
                            borderLeft: "4px solid var(--brand-color)",
                            backgroundImage:
                              "linear-gradient(90deg, color-mix(in srgb, var(--brand-color) 6%, transparent), transparent 55%)",
                          }
                        : undefined
                    }
                  >
                    <span
                      className="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                      style={{ background: softBackground, color: accent }}
                    >
                      {customImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
                        <img src={customImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[19px] font-bold text-[var(--ink)]">
                        {link.title}
                      </span>
                      {link.subtitle && (
                        <span className="mt-0.5 block truncate text-sm text-[var(--muted)]">
                          {link.subtitle}
                        </span>
                      )}
                    </span>

                    {link.is_featured && (
                      <span
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: "var(--brand-color)" }}
                      >
                        Featured
                      </span>
                    )}

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--line)] text-[var(--muted)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-[var(--brand-color)] group-hover:text-white">
                      <ArrowRightIcon className="h-[18px] w-[18px]" />
                    </span>
                  </TrackedLink>
                );
              })}
            </section>
          )}

          {/* FREE RESOURCES */}
          {leadMagnets.length > 0 && (
            <section
              id="free"
              aria-labelledby="h-free"
              className="flex scroll-mt-24 flex-col gap-4"
            >
              <h2
                id="h-free"
                className="m-0 mb-1 font-display text-[28px] font-extrabold tracking-tight text-[var(--ink)] sm:text-[30px]"
              >
                Free resources
              </h2>
              {leadMagnets.map((magnet) => (
                <LeadMagnetCard
                  key={magnet.id}
                  id={magnet.id}
                  profileId={profile.id}
                  title={magnet.title}
                  description={magnet.description}
                  brandColor={brandColor}
                  buttonRadiusClass={buttonRadiusClass}
                />
              ))}
            </section>
          )}

          {/* SHOP */}
          {products.length > 0 && (
            <section id="shop" aria-labelledby="h-shop" className="flex scroll-mt-24 flex-col gap-4">
              <h2
                id="h-shop"
                className="m-0 mb-1 font-display text-[28px] font-extrabold tracking-tight text-[var(--ink)] sm:text-[30px]"
              >
                Shop
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    profileId={profile.id}
                    product={product}
                    brandColor={brandColor}
                    buttonRadiusClass={buttonRadiusClass}
                  />
                ))}
              </div>
            </section>
          )}

          <footer className="flex items-center justify-center gap-1.5 border-t border-black/5 pt-6 text-sm text-[var(--muted)]">
            <span>Made with</span>
            <span style={{ color: "var(--brand-color)" }}>
              <BoltIcon className="h-4 w-4" />
            </span>
            <span className="font-semibold text-[var(--muted)]">Auto DM</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
