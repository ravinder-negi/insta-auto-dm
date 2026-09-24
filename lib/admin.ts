import { createClient } from "@/lib/supabase/server";

/** Checked against `admin_users`, never a hardcoded list — see that table's
 *  RLS: only editable from the Supabase SQL editor, never from the app. */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return !!data;
}
