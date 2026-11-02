import {
  INSTAGRAM_API_VERSION as API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
} from "@/lib/instagram/config";
import type { MediaDetails } from "@/features/analytics/lib/mediaMetrics";

/**
 * Caption, type, thumbnail and link for one post/reel. Null when Instagram
 * won't return it (deleted post, expired token, slow response), so the
 * caller can fall back to a placeholder instead of failing the page.
 */
export async function fetchMediaDetails(
  accessToken: string,
  mediaId: string
): Promise<MediaDetails | null> {
  try {
    const url = new URL(`${INSTAGRAM_GRAPH_BASE_URL}/${API_VERSION}/${mediaId}`);
    url.searchParams.set("fields", "caption,media_type,media_url,thumbnail_url,permalink");
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      caption?: string;
      media_type?: string;
      media_url?: string;
      thumbnail_url?: string;
      permalink?: string;
    };

    return {
      caption: data.caption ?? null,
      mediaType: data.media_type ?? null,
      // Videos and reels only expose a still through thumbnail_url.
      thumbnailUrl: data.thumbnail_url ?? data.media_url ?? null,
      permalink: data.permalink ?? null,
    };
  } catch {
    return null;
  }
}
