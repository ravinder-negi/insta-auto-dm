import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/features/auth/actions/login";
import { isAdmin } from "@/lib/auth/admin";
import { DashboardShell } from "@/components/layout/DashboardShell";

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

  const admin = await isAdmin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      displayName={profile?.display_name ?? null}
      signOutAction={signOut}
      isAdmin={admin}
    >
      {children}
    </DashboardShell>
  );
}
