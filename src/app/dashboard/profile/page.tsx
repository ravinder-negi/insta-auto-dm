import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChartIcon, ExternalLinkIcon } from "@/components/icons";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import {
  displayFont,
  profileCssVars,
  profileWrapperClass,
} from "@/features/profile/fonts";
import type { Profile } from "@/types";

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

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const publicOrigin = `${protocol}://${host}`;
  const publicUrl = profile.username ? `${publicOrigin}/${profile.username}` : null;

  return (
    <div className={profileWrapperClass} style={profileCssVars}>
      <div className="flex flex-col gap-7">
        {/* hero */}
        <div className="relative overflow-hidden rounded-[40px] border border-[var(--line)] bg-white bg-[radial-gradient(#DDD6EC_1.2px,transparent_1.2px)] bg-[length:30px_30px]">
          <div
            className="animate-float pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full opacity-70 blur-[90px]"
            style={{ background: "var(--tint)" }}
          />
          <div
            className="animate-float-delayed pointer-events-none absolute -top-20 -right-24 h-[420px] w-[420px] rounded-full opacity-80 blur-[100px]"
            style={{ background: "var(--secondary-pale-border)" }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-7 p-9 sm:p-11">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-3.5" style={{ flexBasis: "380px" }}>
              <span className="animate-fade-in-up inline-flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-white py-[7px] pr-4 pl-3 text-xs font-bold tracking-[0.1em] text-[var(--muted)] uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
                </span>
                Link-in-bio
              </span>
              <h1
                className={`animate-fade-in-up m-0 ${displayFont} text-[clamp(36px,4.6vw,56px)] leading-[1.03] font-extrabold tracking-[-0.035em]`}
                style={{ animationDelay: "0.1s" }}
              >
                Creator{" "}
                <span className="relative inline-block text-[var(--accent)]">
                  profile
                  <svg
                    className="absolute bottom-[-6px] left-0 h-3.5 w-full"
                    viewBox="0 0 200 14"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9 C 40 2, 90 14, 198 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p
                className="animate-fade-in-up m-0 max-w-[540px] text-lg text-[var(--muted)]"
                style={{ animationDelay: "0.2s" }}
              >
                This is the base of your public page. Links, socials, products and lead
                magnets all attach here.
              </p>
            </div>
            <div
              className="animate-fade-in-up flex flex-wrap gap-3"
              style={{ animationDelay: "0.2s" }}
            >
              <Link
                href="/dashboard/analytics"
                className="inline-flex min-h-[50px] items-center gap-2.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-5.5 font-semibold transition-transform hover:-translate-y-0.5"
              >
                <ChartIcon className="h-[18px] w-[18px]" />
                View analytics
              </Link>
              {publicUrl && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[50px] items-center gap-2.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-5.5 font-semibold transition-transform hover:-translate-y-0.5"
                >
                  <ExternalLinkIcon className="h-[18px] w-[18px]" />
                  View public page
                </a>
              )}
            </div>
          </div>
        </div>

        <ProfileForm userId={user.id} profile={profile} publicOrigin={publicOrigin} />
      </div>
    </div>
  );
}
