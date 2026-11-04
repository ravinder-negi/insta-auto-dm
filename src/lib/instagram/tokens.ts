import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AccountToken {
  instagramUserId: string;
  accessToken: string;
}

/**
 * Access tokens for the signed-in user's own Instagram accounts, keyed by
 * account id. access_token is not readable through the user's own client
 * (see the instagram_accounts column grants), so this reads it with the
 * service role, filtered to the current user's profile.
 */
export async function getOwnAccountTokens(accountIds?: string[]): Promise<Map<string, AccountToken>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Map();

  let query = createAdminClient()
    .from("instagram_accounts")
    .select("id, instagram_user_id, access_token")
    .eq("profile_id", user.id);
  if (accountIds) query = query.in("id", accountIds);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return new Map(
    (data ?? []).map((row) => [
      row.id as string,
      { instagramUserId: row.instagram_user_id as string, accessToken: row.access_token as string },
    ])
  );
}
