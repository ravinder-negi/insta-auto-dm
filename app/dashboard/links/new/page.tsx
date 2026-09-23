import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "../../components/icons";
import { PageHeader } from "../../components/PageHeader";
import { LinkForm } from "../LinkForm";
import { createLink } from "../actions";
import type { Profile } from "@/lib/types";

export default async function NewLinkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

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
          eyebrow="Create link"
          title="New link"
          description="Add a URL to your public profile page."
        />
      </div>

      <LinkForm
        action={createLink}
        submitLabel="Add link"
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
