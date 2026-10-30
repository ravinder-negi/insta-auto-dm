import { ArrowRightIcon, BoltIcon } from "@/components/icons";
import { resolveLinkVisual } from "@/features/links/linkTypeIcons";
import { SOCIAL_PLATFORM_META } from "@/features/socials/socialPlatforms";
import { getButtonRadiusClass, getThemeFontClassName } from "@/features/theme/themeOptions";
import { LeadMagnetCard } from "../LeadMagnetCard";
import { ProductCard } from "../ProductCard";
import { ShareButton } from "../ShareButton";
import { TrackedLink } from "../TrackedLink";
import type { ProfileTemplateProps } from "./types";

export function NoirTemplate({
  profile,
  links,
  socials,
  leadMagnets,
  products,
}: ProfileTemplateProps) {
  const brandColor = profile.brand_color || "#6366f1";
  const fontClassName = getThemeFontClassName(profile.theme_font);
  const buttonRadiusClass = getButtonRadiusClass(profile.theme_button_style);

  const hasLinks = links.length > 0;
  const hasFree = leadMagnets.length > 0;
  const hasShop = products.length > 0;
  // Links/free-resources share a column beside the profile card, sized to
  // whichever of the two is actually present — not a fixed grid span, so one
  // missing section never leaves a dead gap (a `row-span-2` bento grid would).
  const hasSide = hasLinks || hasFree;

  return (
    <main
      className={`relative min-h-screen overflow-x-clip bg-[#0E0D14] text-[#F4F2FA] ${fontClassName}`}
      style={{ "--brand-color": brandColor } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.9) 1.2px, transparent 1.2px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-40 -left-28 h-[35rem] w-[35rem] rounded-full opacity-50 blur-[140px]"
        style={{ backgroundColor: "var(--brand-color)" }}
      />
      <div className="pointer-events-none absolute top-[38%] -right-40 h-[28rem] w-[28rem] rounded-full bg-[#F59E0B] opacity-20 blur-[140px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-7">
        <div className="flex justify-end">
          <ShareButton title={profile.display_name || `@${profile.username}`} brandColor={brandColor} />
        </div>
      </div>

      <div className="relative z-[1] mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-5 pb-14 sm:px-7">
        <div className={`flex flex-col gap-4 ${hasSide ? "lg:flex-row lg:items-stretch" : ""}`}>
          {/* PROFILE */}
          <header
            className={`flex flex-col items-center gap-4 rounded-[32px] border border-white/10 bg-white/[0.06] p-7 text-center backdrop-blur-xl ${hasSide ? "lg:w-[400px] lg:shrink-0 lg:items-start lg:text-left" : "w-full"}`}
          >
            <div className="relative h-36 w-36">
              <span
                className="absolute inset-0 rounded-full motion-safe:animate-[pp-spin_9s_linear_infinite]"
                style={{
                  background: "conic-gradient(var(--brand-color), #F59E0B, #0E0D14, var(--brand-color))",
                }}
              />
              <span className="absolute inset-[5px] rounded-full bg-[#0E0D14] p-[5px]">
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
              <h1 className="m-0 font-display text-[clamp(2.75rem,10vw,4.5rem)] leading-[0.95] font-extrabold tracking-tight text-white">
                {profile.display_name || `@${profile.username}`}
              </h1>
              <span className="mt-3 inline-block rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-sm font-semibold text-[#D9D5E8]">
                @{profile.username}
              </span>
            </div>

            {profile.bio && (
              <p className="max-w-[360px] text-[17px] leading-relaxed whitespace-pre-line text-[#D9D5E8]">
                {profile.bio}
              </p>
            )}

            {socials.length > 0 && (
              <div className="mt-auto flex w-full flex-wrap justify-center gap-3 lg:justify-start" role="list" aria-label="Social links">
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
                      className="group relative flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-6deg] hover:scale-105"
                      style={{ background: meta.background, color: meta.foreground ?? "#ffffff" }}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-[#15131C] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                        {meta.label}
                      </span>
                    </TrackedLink>
                  );
                })}
              </div>
            )}
          </header>

          {hasSide && (
            <div className="flex flex-1 flex-col gap-4">
              {/* LINKS */}
              {hasLinks && (
                <section aria-label="Links" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        className={`group relative flex min-h-[150px] flex-col justify-between gap-7 border border-white/10 bg-white/[0.07] p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12] ${buttonRadiusClass === "rounded-full" ? "rounded-[28px]" : buttonRadiusClass}`}
                      >
                        <span
                          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl"
                          style={{ background: softBackground, color: accent }}
                        >
                          {customImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
                            <img src={customImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Icon className="h-6 w-6" />
                          )}
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="font-display text-xl font-extrabold tracking-tight">{link.title}</span>
                          {link.subtitle && <span className="text-[13px] text-[#A9A5BA]">{link.subtitle}</span>}
                        </span>
                        <span className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-white group-hover:text-[#15131C]">
                          <ArrowRightIcon className="h-[18px] w-[18px]" />
                        </span>
                      </TrackedLink>
                    );
                  })}
                </section>
              )}

              {/* FREE RESOURCES */}
              {hasFree && (
                <section aria-label="Free resources" className="flex flex-col gap-4">
                  {leadMagnets.map((magnet) => (
                    <LeadMagnetCard
                      key={magnet.id}
                      id={magnet.id}
                      profileId={profile.id}
                      title={magnet.title}
                      description={magnet.description}
                      brandColor={brandColor}
                      buttonRadiusClass={buttonRadiusClass}
                      tone="dark"
                    />
                  ))}
                </section>
              )}
            </div>
          )}
        </div>

        {/* SHOP */}
        {hasShop && (
          <section aria-labelledby="h-shop" className="flex flex-col gap-4">
            <h2 id="h-shop" className="m-0 mt-2 font-display text-[32px] font-extrabold tracking-tight text-white">
              Shop
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

        <footer className="flex items-center justify-center gap-1.5 border-t border-white/10 pt-6 text-sm text-[#A9A5BA]">
          <span>Made with</span>
          <span style={{ color: "var(--brand-color)" }}>
            <BoltIcon className="h-4 w-4" />
          </span>
          <span className="font-semibold text-[#A9A5BA]">Auto DM</span>
        </footer>
      </div>
    </main>
  );
}
