import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { secondaryButtonClass } from "@/components/ui/styles";
import { ChartIcon, ExternalLinkIcon } from "@/components/icons";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import type { Profile, ProfileLink } from "@/types";

export default async function ProfilePage() {
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

  if (!profile) {
    redirect("/login");
  }

  const { data: links } = await supabase
    .from("profile_links")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .returns<ProfileLink[]>();

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const publicOrigin = `${protocol}://${host}`;
  const publicUrl = profile.username ? `${publicOrigin}/${profile.username}` : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Link-in-bio"
        title="Creator profile"
        description="This is the base of your public page — links, socials, products, and lead magnets all attach here."
        actions={
          <>
            <Link href="/dashboard/analytics" className={secondaryButtonClass}>
              <ChartIcon className="h-4 w-4" />
              View analytics
            </Link>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryButtonClass}
              >
                <ExternalLinkIcon className="h-4 w-4" />
                View public page
              </a>
            )}
          </>
        }
      />
      <ProfileForm
        userId={user.id}
        profile={profile}
        publicOrigin={publicOrigin}
        links={links ?? []}
      />
    </div>
  );
}
