import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordProfileView } from "./actions";
import { CenteredTemplate } from "./_components/templates/CenteredTemplate";
import { NoirTemplate } from "./_components/templates/NoirTemplate";
import { OriginalTemplate } from "./_components/templates/OriginalTemplate";
import type { LeadMagnet, Product, Profile, ProfileLink, ProfileSocial } from "@/types";

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

async function getActiveProducts(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .returns<Product[]>();

  return data ?? [];
}

type Params = Promise<{ username: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

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
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { username } = await params;
  const profile = await getPublishedProfile(username);

  if (!profile) {
    notFound();
  }

  const [links, socials, leadMagnets, products, query, requestHeaders, viewSupabase] =
    await Promise.all([
      getActiveLinks(profile.id),
      getActiveSocials(profile.id),
      getActiveLeadMagnets(profile.id),
      getActiveProducts(profile.id),
      searchParams,
      headers(),
      createClient(),
    ]);

  // createClient() reads cookies(), which `after()` can't call — so the
  // client has to be created out here and handed in, not built from scratch
  // inside the callback.
  after(() =>
    recordProfileView(viewSupabase, profile.id, requestHeaders.get("referer"), {
      source: firstParam(query.utm_source),
      medium: firstParam(query.utm_medium),
      campaign: firstParam(query.utm_campaign),
    })
  );

  const templateProps = { profile, links, socials, leadMagnets, products };

  switch (profile.theme_template) {
    case "centered":
      return <CenteredTemplate {...templateProps} />;
    case "noir":
      return <NoirTemplate {...templateProps} />;
    default:
      return <OriginalTemplate {...templateProps} />;
  }
}
