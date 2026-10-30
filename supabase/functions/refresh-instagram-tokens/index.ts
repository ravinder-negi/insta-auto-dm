import { createClient } from "npm:@supabase/supabase-js@2";
import { refreshLongLivedToken } from "../_shared/instagramToken.ts";
import { refreshDueTokens, type DueAccount, type TokenStore } from "./refresh.ts";

/**
 * Daily refresh of long-lived Instagram tokens, invoked by the
 * refresh-instagram-tokens pg_cron job (see the token refresh migration).
 * Without it every connected account silently stops sending ~60 days after
 * it was connected.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SECRET_KEY = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)["default"];
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const CRON_SECRET = Deno.env.get("TOKEN_REFRESH_CRON_SECRET");
const INSTAGRAM_GRAPH_BASE_URL =
  Deno.env.get("INSTAGRAM_GRAPH_BASE_URL") || "https://graph.instagram.com";

const ACCOUNT_COLUMNS = "id, instagram_user_id, access_token, token_expires_at";

const store: TokenStore = {
  async listDue({ expiresBefore, issuedBefore }) {
    const { data, error } = await supabaseAdmin
      .from("instagram_accounts")
      .select(ACCOUNT_COLUMNS)
      .eq("token_status", "active")
      .lt("token_refreshed_at", issuedBefore)
      .or(`token_expires_at.is.null,token_expires_at.lt."${expiresBefore}"`)
      .order("token_expires_at", { ascending: true, nullsFirst: true })
      .limit(200);

    if (error) throw new Error(`Listing due tokens failed: ${error.message}`);
    return (data ?? []) as DueAccount[];
  },

  async saveRefreshed(account, { accessToken, expiresAt, refreshedAt }) {
    const { data, error } = await supabaseAdmin
      .from("instagram_accounts")
      .update({
        access_token: accessToken,
        token_expires_at: expiresAt,
        token_refreshed_at: refreshedAt,
        token_status: "active",
        token_error: null,
      })
      .eq("id", account.id)
      .eq("access_token", account.access_token)
      .select("id");

    if (error) throw new Error(`Saving refreshed token failed: ${error.message}`);
    return (data ?? []).length > 0;
  },

  async saveFailure(account, { expired, error: message }) {
    const { error } = await supabaseAdmin
      .from("instagram_accounts")
      .update({
        token_error: message,
        ...(expired ? { token_status: "expired" } : {}),
      })
      .eq("id", account.id)
      .eq("access_token", account.access_token);

    if (error) console.error("Saving token failure failed:", account.id, error.message);
  },
};

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!CRON_SECRET || !constantTimeEqual(req.headers.get("x-cron-secret") ?? "", CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const summary = await refreshDueTokens({
      store,
      refresh: (accessToken) => refreshLongLivedToken(INSTAGRAM_GRAPH_BASE_URL, accessToken),
    });
    console.log("Instagram token refresh:", JSON.stringify(summary));
    return Response.json(summary);
  } catch (error) {
    console.error("Instagram token refresh failed:", String(error));
    return new Response("Internal Server Error", { status: 500 });
  }
});
