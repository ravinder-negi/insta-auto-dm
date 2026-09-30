import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  INSTAGRAM_API_VERSION as API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
} from "@/lib/instagram/config";

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("account_id");

  if (!accountId) {
    return NextResponse.json({ error: "account_id is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // RLS scopes this to the signed-in user's own accounts.
  const { data: account, error: accountError } = await supabase
    .from("instagram_accounts")
    .select("instagram_user_id, access_token")
    .eq("id", accountId)
    .maybeSingle();

  if (accountError || !account) {
    return NextResponse.json({ error: "Instagram account not found" }, { status: 404 });
  }

  const mediaUrl = new URL(
    `${INSTAGRAM_GRAPH_BASE_URL}/${API_VERSION}/${account.instagram_user_id}/media`
  );
  mediaUrl.searchParams.set(
    "fields",
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
  );
  mediaUrl.searchParams.set("limit", "25");
  mediaUrl.searchParams.set("access_token", account.access_token);

  const mediaResponse = await fetch(mediaUrl);
  const mediaBody = await mediaResponse.json().catch(() => null);

  if (!mediaResponse.ok) {
    return NextResponse.json(
      { error: mediaBody?.error?.message ?? "Failed to load posts from Instagram" },
      { status: 502 }
    );
  }

  interface InstagramMediaItem {
    id: string;
    caption?: string;
    media_type: string;
    media_url?: string;
    thumbnail_url?: string;
    permalink: string;
    timestamp: string;
  }

  const items = ((mediaBody?.data ?? []) as InstagramMediaItem[]).map((item) => ({
    id: item.id,
    caption: item.caption ?? null,
    media_type: item.media_type,
    thumbnail_url: item.thumbnail_url ?? item.media_url ?? null,
    permalink: item.permalink,
    timestamp: item.timestamp,
  }));

  return NextResponse.json({ items });
}
