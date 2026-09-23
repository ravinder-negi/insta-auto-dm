import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { LinkIcon, PlusIcon } from "../components/icons";
import { primaryButtonClass } from "../components/styles";
import { LinksList } from "./LinksList";
import { LinksPreview } from "./LinksPreview";
import type { Profile, ProfileLink } from "@/lib/types";

export default async function LinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: linkRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("profile_links")
      .select("*")
      .eq("profile_id", user.id)
      .order("position", { ascending: true })
      .returns<ProfileLink[]>(),
  ]);

  const links = linkRows ?? [];
  const brandColor = profile?.brand_color || "#6366f1";

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Link-in-bio"
          title="Links"
          description="Add and organize the URLs that show up on your public profile."
        />

        {links.length === 0 ? (
          <EmptyState
            icon={<LinkIcon className="h-6 w-6" />}
            title="No links yet"
            description="Add a website, YouTube channel, blog, product, or custom page to your profile."
            action={
              <Link href="/dashboard/links/new" className={primaryButtonClass}>
                <PlusIcon className="h-4 w-4" />
                Add your first link
              </Link>
            }
          />
        ) : (
          <LinksList links={links} brandColor={brandColor} />
        )}
      </div>

      <aside className="lg:sticky lg:top-6">
        <LinksPreview
          brandColor={brandColor}
          avatarUrl={profile?.avatar_url ?? null}
          displayName={profile?.display_name ?? null}
          username={profile?.username ?? null}
          bio={profile?.bio ?? null}
          links={links.filter((link) => link.is_active)}
        />
      </aside>
    </div>
  );
}
