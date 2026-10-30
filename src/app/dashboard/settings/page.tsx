import Link from "next/link";
import { signOut } from "@/features/auth/actions/login";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { formatDate } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowRightIcon, InstagramIcon } from "@/components/icons";
import { displayFont, linkInBioCssVars, linkInBioWrapperClass } from "@/lib/linkInBioTheme";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { count: accountCount },
    { count: ruleCount },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("instagram_accounts")
      .select("id", { count: "exact", head: true }),
    supabase.from("automation_rules").select("id", { count: "exact", head: true }),
  ]);

  const email = user?.email ?? "";

  return (
    <div className={linkInBioWrapperClass} style={linkInBioCssVars}>
      <div className="flex flex-col gap-7">
        {/* hero */}
        <div className="relative overflow-hidden rounded-[40px] border border-[var(--line)] bg-white bg-[radial-gradient(#DDD6EC_1.2px,transparent_1.2px)] bg-[length:30px_30px]">
          <div
            className="animate-float pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full opacity-70 blur-[90px]"
            style={{ background: "var(--secondary-pale-border)" }}
          />
          <div
            className="animate-float-delayed pointer-events-none absolute -top-20 -right-24 h-[420px] w-[420px] rounded-full opacity-80 blur-[100px]"
            style={{ background: "var(--tint)" }}
          />
          <div className="relative flex flex-col gap-3.5 p-9 sm:p-11">
            <span className="animate-fade-in-up inline-flex w-fit items-center gap-2.5 rounded-full border border-[var(--line)] bg-white py-[7px] pr-4 pl-3 text-xs font-bold tracking-[0.1em] text-[var(--muted)] uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
              </span>
              Account
            </span>
            <h1
              className={`animate-fade-in-up m-0 ${displayFont} text-[clamp(32px,4.2vw,48px)] leading-[1.03] font-extrabold tracking-[-0.035em]`}
              style={{ animationDelay: "0.1s" }}
            >
              Your{" "}
              <span className="relative inline-block text-[var(--accent)]">
                settings
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
              Your profile, appearance, and the accounts this workspace automates.
            </p>
          </div>
        </div>

        {/* profile */}
        <div className="flex flex-col gap-5 rounded-[36px] border-[1.5px] border-[var(--line)] bg-white p-7 sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={email} size="lg" />
            <div className="min-w-0">
              <p className="m-0 truncate text-lg font-bold">{email.split("@")[0]}</p>
              <p className="m-0 truncate text-sm text-[var(--muted)]">{email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatPill
              value={user?.created_at ? formatDate(user.created_at) : "—"}
              label="Member since"
              bg="var(--tint)"
              fg="var(--primary-deep)"
            />
            <StatPill value={String(accountCount ?? 0)} label="Connected accounts" bg="var(--tint2)" fg="#3B3560" />
            <StatPill value={String(ruleCount ?? 0)} label="AutoDMs" bg="var(--success-tint)" fg="var(--success-text)" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {/* Hidden for now — re-enable once dark theme coverage is finished.
          <SettingsCard title="Appearance">
            <p className="m-0 text-sm text-[var(--muted)]">
              Light and dark themes follow your system by default. Pick one to override it on
              this device, or use the switch in the header.
            </p>
            <ThemeSwitch />
          </SettingsCard>
          */}

          <SettingsCard title="Instagram">
            <p className="m-0 text-sm text-[var(--muted)]">
              Connect, pause, or disconnect the accounts this workspace automates.
            </p>
            <Link
              href="/dashboard/accounts"
              className="inline-flex min-h-[44px] w-fit items-center gap-2 rounded-full border-[1.5px] border-[var(--line)] bg-white px-5 text-sm font-bold transition-colors hover:bg-[var(--secondary-soft-bg)]"
            >
              <InstagramIcon className="h-4 w-4" />
              Manage accounts
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </SettingsCard>

          <SettingsCard title="Session" danger>
            <p className="m-0 text-sm text-[var(--muted)]">Sign out of Auto DM on this device.</p>
            <SignOutButton signOutAction={signOut} variant="text" />
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}

function StatPill({ value, label, bg, fg }: { value: string; label: string; bg: string; fg: string }) {
  return (
    <div
      className="flex min-w-0 flex-1 basis-[170px] flex-col gap-0.5 rounded-full px-5 py-3"
      style={{ backgroundColor: bg, color: fg }}
    >
      <span className="truncate text-base font-extrabold tracking-tight">{value}</span>
      <span className="truncate text-[11px] font-bold tracking-wide uppercase opacity-80">{label}</span>
    </div>
  );
}

function SettingsCard({
  title,
  danger = false,
  children,
}: {
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex flex-col gap-3.5 rounded-[30px] border-[1.5px] p-6 transition-[transform,box-shadow,border-color] hover:-translate-y-1 ${
        danger
          ? "border-[var(--danger-border)] bg-[var(--danger-tint-faint)] hover:border-[var(--danger-ring)]"
          : "border-[var(--line)] bg-white hover:border-[var(--secondary-border)] hover:shadow-[0_28px_46px_-30px_color-mix(in srgb, var(--secondary) 50%, transparent)]"
      }`}
    >
      <h3 className={`m-0 text-lg font-extrabold tracking-[-0.01em] ${danger ? "text-[var(--danger-deep)]" : ""}`}>
        {title}
      </h3>
      {children}
    </section>
  );
}
