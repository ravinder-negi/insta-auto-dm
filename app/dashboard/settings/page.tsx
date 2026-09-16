import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../components/PageHeader";
import { SignOutButton } from "../components/SignOutButton";
import { formatDate } from "../components/format";
import { secondaryButtonClass } from "../components/styles";
import { Avatar } from "../components/Avatar";
import { InstagramIcon } from "../components/icons";

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
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Settings"
        title="Account settings"
        description="Your profile and workspace at a glance."
      />

      <section className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
        <h2 className="text-base font-semibold tracking-tight">Profile</h2>

        <div className="mt-4 flex items-center gap-3.5">
          <Avatar name={email} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{email.split("@")[0]}</p>
            <p className="truncate text-sm text-zinc-500">{email}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Detail label="Member since">
            {user?.created_at ? formatDate(user.created_at) : "—"}
          </Detail>
          <Detail label="Connected accounts">{accountCount ?? 0}</Detail>
          <Detail label="Automation rules">{ruleCount ?? 0}</Detail>
        </dl>
      </section>

      <section className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
        <h2 className="text-base font-semibold tracking-tight">Appearance</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Light and dark themes follow your system by default. Use the sun/moon
          switch in the header to override it on this device.
        </p>
      </section>

      <section className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
        <h2 className="text-base font-semibold tracking-tight">Instagram</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Connect, pause, or disconnect the accounts this workspace automates.
        </p>
        <Link
          href="/dashboard/accounts"
          className={`${secondaryButtonClass} mt-4`}
        >
          <InstagramIcon className="h-4 w-4" />
          Manage accounts
        </Link>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 dark:border-rose-500/30 dark:bg-rose-500/5">
        <h2 className="text-base font-semibold tracking-tight">Session</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Sign out of Auto DM on this device.
        </p>
        <div className="mt-4">
          <SignOutButton signOutAction={signOut} variant="text" />
        </div>
      </section>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-white/5">
      <dt className="text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{children}</dd>
    </div>
  );
}
