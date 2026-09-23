import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BoltIcon, ChevronDownIcon } from "../dashboard/components/icons";
import { resolveLinkVisual } from "../dashboard/links/linkTypeIcons";
import { SOCIAL_PLATFORM_META } from "../dashboard/socials/socialPlatforms";
import { getButtonRadiusClass, getThemeFontClassName } from "../dashboard/theme/themeOptions";
import { LeadMagnetCard } from "./LeadMagnetCard";
import { ShareButton } from "./ShareButton";
import type { LeadMagnet, Profile, ProfileLink, ProfileSocial } from "@/lib/types";

async function getPublishedProfile(username: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .eq("is_published", true)
    .maybeSingle<Profile>();

  return data;
}

async function getActiveLinks(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_links")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .returns<ProfileLink[]>();

  return data ?? [];
}

async function getActiveSocials(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_socials")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .returns<ProfileSocial[]>();

  return data ?? [];
}

async function getActiveLeadMagnets(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_magnets")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .returns<LeadMagnet[]>();

  return data ?? [];
}

type Params = Promise<{ username: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublishedProfile(username);

  if (!profile) return { title: "Profile not found" };

  const name = profile.display_name || `@${profile.username}`;
  return {
    title: name,
    description: profile.bio ?? undefined,
    openGraph: {
      title: name,
      description: profile.bio ?? undefined,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Params;
}) {
  const { username } = await params;
  const profile = await getPublishedProfile(username);

  if (!profile) {
    notFound();
  }

  const [links, socials, leadMagnets] = await Promise.all([
    getActiveLinks(profile.id),
    getActiveSocials(profile.id),
    getActiveLeadMagnets(profile.id),
  ]);
  const brandColor = profile.brand_color || "#6366f1";
  const fontClassName = getThemeFontClassName(profile.theme_font);
  const buttonRadiusClass = getButtonRadiusClass(profile.theme_button_style);
  const isLeftAligned = profile.theme_layout === "left";

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-[#fbfbff] px-5 py-12 sm:px-6 dark:bg-zinc-950 ${fontClassName}`}
      style={{ "--brand-color": brandColor } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${brandColor}14 0%, ${brandColor}08 40%, ${brandColor}12 100%)`,
          }}
        />
        <div
          className="absolute -top-44 -left-36 h-[30rem] w-[30rem] rounded-full opacity-[0.16] blur-2xl"
          style={{ backgroundColor: brandColor }}
        />
        <div
          className="absolute top-14 left-3 h-36 w-24 opacity-30"
          style={{
            backgroundImage: `radial-gradient(${brandColor} 1.5px, transparent 1.5px)`,
            backgroundSize: "15px 15px",
          }}
        />
        <div
          className="absolute top-24 -right-96 h-[52rem] w-[52rem] rounded-full opacity-[0.07] blur-3xl"
          style={{ backgroundColor: brandColor }}
        />
        <div
          className="absolute top-56 right-24 hidden h-16 w-16 rounded-full opacity-25 lg:block"
          style={{ backgroundColor: brandColor }}
        />
        <div
          className="absolute -right-24 -bottom-48 h-[32rem] w-[32rem] rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: brandColor }}
        />
      </div>

      <ShareButton title={profile.display_name || `@${profile.username}`} />

      <div
        className={`relative mx-auto flex w-full max-w-205 flex-col ${
          isLeftAligned ? "items-start text-left" : "items-center text-center"
        }`}
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
          <img
            src={profile.avatar_url}
            alt={profile.display_name ?? profile.username ?? ""}
            className="h-32 w-32 rounded-full object-cover shadow-xl ring-4 ring-white dark:ring-zinc-900"
          />
        ) : (
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full text-4xl font-semibold text-white shadow-xl ring-4 ring-white dark:ring-zinc-900"
            style={{ backgroundColor: brandColor }}
          >
            {(profile.display_name || profile.username || "?")
              .slice(0, 1)
              .toUpperCase()}
          </div>
        )}

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {profile.display_name || `@${profile.username}`}
        </h1>
        <p className="mt-1 text-base text-zinc-400 dark:text-zinc-500">
          @{profile.username}
        </p>

        {profile.bio && (
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed whitespace-pre-line text-zinc-600 dark:text-zinc-300">
            {profile.bio}
          </p>
        )}

        {socials.length > 0 && (
          <div
            className={`mt-6 flex flex-wrap items-center gap-2.5 ${
              isLeftAligned ? "justify-start" : "justify-center"
            }`}
          >
            {socials.map((social) => {
              const meta = SOCIAL_PLATFORM_META[social.platform];
              const Icon = meta.icon;
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={meta.label}
                  title={meta.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 transition-transform hover:scale-110 active:scale-95"
                  style={{ background: meta.background, color: meta.foreground ?? "#ffffff" }}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-9 flex w-full flex-col gap-3.5">
            {links.map((link) => {
              const { customImageUrl, Icon, softBackground, accent } = resolveLinkVisual(
                link,
                brandColor
              );
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-4 bg-white px-5 py-4 text-left shadow-[0_4px_20px_-8px_rgba(24,24,60,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(24,24,60,0.28)] active:translate-y-0 dark:bg-white/5 ${buttonRadiusClass}`}
                  style={
                    link.is_featured
                      ? {
                          borderLeft: `4px solid ${brandColor}`,
                          backgroundImage: `linear-gradient(90deg, ${brandColor}0f, transparent 55%)`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                    style={{ background: softBackground, color: accent }}
                  >
                    {customImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
                      <img src={customImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-bold text-zinc-900 dark:text-zinc-50">
                      {link.title}
                    </span>
                    {link.subtitle && (
                      <span className="mt-0.5 block truncate text-sm text-zinc-500 dark:text-zinc-400">
                        {link.subtitle}
                      </span>
                    )}
                  </span>

                  {link.is_featured && (
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      Featured
                    </span>
                  )}

                  <ChevronDownIcon className="h-5 w-5 shrink-0 -rotate-90 text-zinc-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600" />
                </a>
              );
            })}
          </div>
        )}

        {leadMagnets.length > 0 && (
          <div className="mt-6 flex w-full flex-col gap-4">
            {leadMagnets.map((magnet) => (
              <LeadMagnetCard
                key={magnet.id}
                id={magnet.id}
                title={magnet.title}
                description={magnet.description}
                brandColor={brandColor}
                buttonRadiusClass={buttonRadiusClass}
              />
            ))}
          </div>
        )}

        {/* Products render here as their own feature lands. */}

        <div className="mt-14 w-full border-t border-black/5 pt-6 text-center text-sm text-zinc-400 dark:border-white/10">
          <span className="inline-flex items-center gap-1.5">
            Made with
            <span style={{ color: brandColor }}>
              <BoltIcon className="h-4 w-4" />
            </span>
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Auto DM</span>
          </span>
        </div>
      </div>
    </main>
  );
}
