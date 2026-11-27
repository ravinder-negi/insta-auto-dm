import { NextResponse, type NextRequest } from "next/server";
import {
  INSTAGRAM_API_VERSION as API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
} from "@/lib/instagram/config";
import { getOwnAccountTokens } from "@/lib/instagram/tokens";

const POST_METRICS =
  "views,reach,saved,shares,likes,comments,total_interactions,impressions";
const REEL_METRICS =
  "views,reach,saved,shares,likes,comments,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time";

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("account_id");
  const mediaId = request.nextUrl.searchParams.get("media_id");
  const mediaProductType =
    request.nextUrl.searchParams.get("media_product_type") ?? "POST";

  if (!accountId || !mediaId) {
    return NextResponse.json(
      { error: "account_id and media_id are required" },
      { status: 400 }
    );
  }

  const account = (
    await getOwnAccountTokens([accountId]).catch(() => null)
  )?.get(accountId);

  if (!account) {
    return NextResponse.json(
      { error: "Instagram account not found" },
      { status: 404 }
    );
  }

  const isReel = mediaProductType.toUpperCase() === "REELS";
  const metrics = isReel ? REEL_METRICS : POST_METRICS;

  const insightsUrl = new URL(
    `${INSTAGRAM_GRAPH_BASE_URL}/${API_VERSION}/${mediaId}/insights`
  );
  insightsUrl.searchParams.set("metric", metrics);
  insightsUrl.searchParams.set("access_token", account.accessToken);

  const insightsResponse = await fetch(insightsUrl);
  const insightsBody = await insightsResponse.json().catch(() => null);

  if (!insightsResponse.ok) {
    return NextResponse.json(
      {
        error:
          insightsBody?.error?.message ??
          "Failed to load insights from Instagram",
      },
      { status: 502 }
    );
  }

  interface InsightMetric {
    name: string;
    values?: Array<{ value: number }>;
    value?: number;
  }

  const flat: Record<string, number> = {};
  for (const metric of (insightsBody?.data ?? []) as InsightMetric[]) {
    const value = metric.value ?? metric.values?.[0]?.value ?? 0;
    flat[metric.name] = value;
  }

  return NextResponse.json({ insights: flat });
}
