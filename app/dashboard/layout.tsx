import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { isAdmin } from "@/lib/admin";
import { DashboardShell } from "./DashboardShell";

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
