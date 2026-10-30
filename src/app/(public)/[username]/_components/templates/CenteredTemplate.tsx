"use client";

import { useState } from "react";
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

type TabId = "links" | "free" | "shop";

export function CenteredTemplate({
  profile,
  links,
  socials,
  leadMagnets,
  products,
}: ProfileTemplateProps) {
  const brandColor = profile.brand_color || "#6366f1";
  const fontClassName = getThemeFontClassName(profile.theme_font);
  const buttonRadiusClass = getButtonRadiusClass(profile.theme_button_style);

  const tabs: { id: TabId; label: string }[] = [
    links.length > 0 ? { id: "links", label: "Links" } : null,
    leadMagnets.length > 0 ? { id: "free", label: "Free" } : null,
    products.length > 0 ? { id: "shop", label: "Shop" } : null,
  ].filter((tab): tab is { id: TabId; label: string } => tab !== null);

  const [activeTab, setActiveTab] = useState<TabId | undefined>(tabs[0]?.id);
  const active = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id;

  return (
    <main
      className={`relative min-h-screen overflow-x-clip bg-[var(--bg)] ${fontClassName}`}
      style={{ ...linkInBioCssVars, "--brand-color": brandColor } as React.CSSProperties}
    >
      {/* COVER */}
      <div
        className="relative h-[220px] overflow-hidden lg:h-[280px]"
        style={{
          backgroundImage:
            "linear-gradient(120deg, color-mix(in srgb, var(--brand-color) 80%, black) 0%, var(--brand-color) 55%, color-mix(in srgb, var(--brand-color) 55%, white) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,.8) 1.3px, transparent 1.3px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute -top-20 right-[8%] h-72 w-72 rounded-full bg-[#F59E0B] opacity-45 blur-[90px] motion-safe:animate-[pp-drift-1_14s_ease-in-out_infinite]" />
        <div className="absolute -bottom-28 left-[6%] h-80 w-80 rounded-full bg-white opacity-30 blur-[100px] motion-safe:animate-[pp-drift-2_17s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 mx-auto -mt-24 flex w-full max-w-[580px] flex-col items-center gap-4 px-5 pb-16 text-center lg:-mt-28 lg:max-w-[760px] lg:gap-5 lg:px-8">
        <div className="flex w-full justify-end">
          <ShareButton title={profile.display_name || `@${profile.username}`} brandColor={brandColor} />
        </div>

        <div className="relative h-36 w-36 lg:h-44 lg:w-44">
          <span
            className="absolute inset-0 rounded-full motion-safe:animate-[pp-spin_9s_linear_infinite]"
            style={{
              background: "conic-gradient(var(--brand-color), #F59E0B, #fff, var(--brand-color))",
            }}
          />
          <span className="absolute inset-[5px] rounded-full bg-white p-[5px] shadow-[0_20px_40px_-20px_rgba(21,19,28,0.6)]">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.username ?? ""}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-full font-display text-5xl font-extrabold text-white lg:text-6xl"
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
          <h1 className="m-0 font-display text-[clamp(2.375rem,9vw,4rem)] leading-none font-extrabold tracking-tight text-[var(--ink)]">
            {profile.display_name || `@${profile.username}`}
          </h1>
          <span className="mt-2.5 inline-block rounded-full border border-black/10 bg-white px-3.5 py-1 text-sm font-semibold text-[var(--muted)]">
            @{profile.username}
          </span>
        </div>

        {profile.bio && (
          <p className="max-w-[380px] text-[17px] leading-relaxed whitespace-pre-line text-[var(--ink)] lg:max-w-[520px] lg:text-lg">
            {profile.bio}
          </p>
        )}

        {socials.length > 0 && (
          <div className="flex w-full flex-wrap justify-center gap-3" role="list" aria-label="Social links">
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
                  className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-6deg] hover:scale-105 lg:h-14 lg:w-14"
                  style={{ background: meta.background, color: meta.foreground ?? "#ffffff" }}
                >
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-[var(--ink)] px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {meta.label}
                  </span>
                </TrackedLink>
              );
            })}
          </div>
        )}

        {tabs.length > 1 && (
          <div
            role="tablist"
            aria-label="Sections"
            className="sticky top-3 z-[6] flex w-full max-w-[420px] gap-1 rounded-full border border-black/10 bg-white/85 p-1.5 shadow-[0_14px_28px_-18px_rgba(21,19,28,0.5)] backdrop-blur-md lg:top-5"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="min-h-11 flex-1 rounded-full text-[15px] font-bold transition-colors"
                style={{
                  background: active === tab.id ? "var(--brand-color)" : "transparent",
                  color: active === tab.id ? "#fff" : "var(--ink)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* LINKS */}
        {active === "links" && links.length > 0 && (
          <section aria-label="Links" className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2">
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
                  className={`group relative flex w-full items-center gap-3.5 border border-black/[0.07] bg-white p-3 shadow-[0_14px_28px_-22px_rgba(21,19,28,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_22px_36px_-24px_var(--brand-color)] ${buttonRadiusClass === "rounded-full" ? "rounded-full" : buttonRadiusClass}`}
                >
                  <span
                    className="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{ background: softBackground, color: accent }}
                  >
                    {customImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
                      <img src={customImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-center font-display text-[19px] font-bold tracking-tight text-[var(--ink)]">
                    {link.title}
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--line)] text-[var(--muted)] transition-all duration-300 group-hover:bg-[var(--brand-color)] group-hover:text-white">
                    <ArrowRightIcon className="h-[18px] w-[18px]" />
                  </span>
                  {link.is_featured && (
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: "var(--brand-color)" }}
                    >
                      Featured
                    </span>
                  )}
                </TrackedLink>
              );
            })}
          </section>
        )}

        {/* FREE RESOURCES */}
        {active === "free" && leadMagnets.length > 0 && (
          <section aria-label="Free resources" className="flex w-full flex-col gap-4">
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
        {active === "shop" && products.length > 0 && (
          <section aria-label="Shop" className="grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                profileId={profile.id}
                product={product}
                brandColor={brandColor}
                buttonRadiusClass={buttonRadiusClass}
              />
            ))}
          </section>
        )}

        <footer className="mt-3 flex w-full items-center justify-center gap-1.5 border-t border-black/10 pt-6 text-sm text-[var(--muted)]">
          <span>Made with</span>
          <span style={{ color: "var(--brand-color)" }}>
            <BoltIcon className="h-4 w-4" />
          </span>
          <span className="font-semibold text-[var(--muted)]">Auto DM</span>
        </footer>
      </div>
    </main>
  );
}
