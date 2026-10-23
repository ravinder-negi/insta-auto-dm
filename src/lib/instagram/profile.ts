import {
  INSTAGRAM_API_VERSION as API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
} from "@/lib/instagram/config";

export interface InstagramProfileStats {
  profilePictureUrl: string | null;
  followersCount: number | null;
  followsCount: number | null;
  mediaCount: number | null;
}

/** Fetches live profile stats for a connected account. Returns null on any failure — callers should degrade gracefully rather than block the page on Meta being slow or rate-limiting. */
export async function fetchInstagramProfileStats(
  accessToken: string
): Promise<InstagramProfileStats | null> {
  try {
    const url = new URL(`${INSTAGRAM_GRAPH_BASE_URL}/${API_VERSION}/me`);
    url.searchParams.set(
      "fields",
      "profile_picture_url,followers_count,follows_count,media_count"
    );
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      profile_picture_url?: string;
      followers_count?: number;
      follows_count?: number;
      media_count?: number;
    };

    return {
      profilePictureUrl: data.profile_picture_url ?? null,
      followersCount: data.followers_count ?? null,
      followsCount: data.follows_count ?? null,
      mediaCount: data.media_count ?? null,
    };
  } catch {
    return null;
  }
}
