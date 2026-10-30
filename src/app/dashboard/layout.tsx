import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/features/auth/actions/login";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ReconnectBanner } from "@/components/layout/ReconnectBanner";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: expiredAccounts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("instagram_accounts")
      .select("username, instagram_user_id")
      .eq("token_status", "expired"),
  ]);

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      displayName={profile?.display_name ?? null}
      signOutAction={signOut}
    >
      <ReconnectBanner
        handles={(expiredAccounts ?? []).map(
          (account) => account.username ?? account.instagram_user_id
        )}
      />
      {children}
    </DashboardShell>
  );
}
