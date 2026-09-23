import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/PageHeader";
import { LinkForm } from "../../LinkForm";
import { updateLink } from "../../actions";
import type { Profile, ProfileLink } from "@/lib/types";

export default async function EditLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: link }, { data: profile }] = await Promise.all([
    supabase
      .from("profile_links")
      .select("id, title, subtitle, url, link_type, icon, custom_icon_url, is_active, is_featured")
      .eq("id", id)
      .maybeSingle<
        Pick<
          ProfileLink,
          | "id"
          | "title"
          | "subtitle"
          | "url"
          | "link_type"
          | "icon"
          | "custom_icon_url"
          | "is_active"
          | "is_featured"
        >
      >(),
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
  ]);

  if (!link) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Link
          href="/dashboard/links"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to links
        </Link>
        <PageHeader
          eyebrow="Edit link"
          title={link.title}
          description="Update this link's title, URL, or type."
        />
      </div>

      <LinkForm
        action={updateLink.bind(null, id)}
        initialValues={{
          title: link.title,
          subtitle: link.subtitle,
          url: link.url,
          link_type: link.link_type,
          icon: link.icon,
          custom_icon_url: link.custom_icon_url,
          is_active: link.is_active,
          is_featured: link.is_featured,
        }}
        submitLabel="Save changes"
        userId={user.id}
        profile={{
          brandColor: profile?.brand_color || "#6366f1",
          avatarUrl: profile?.avatar_url ?? null,
          displayName: profile?.display_name ?? null,
          username: profile?.username ?? null,
          bio: profile?.bio ?? null,
        }}
      />
    </div>
  );
}
