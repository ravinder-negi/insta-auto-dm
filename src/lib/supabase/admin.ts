import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client: bypasses RLS. Server-only, never imported by client
 * components. Use it only for the few things the signed-in user's client is
 * deliberately not allowed to do (reading Instagram access tokens, storing
 * an account after OAuth), and always scope queries to the current user.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not configured on the server.");
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
