import { NextResponse, type NextRequest } from "next/server";
import {
  INSTAGRAM_API_VERSION as API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
} from "@/lib/instagram/config";
import { getOwnAccountTokens } from "@/lib/instagram/tokens";

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("account_id");
  const audioType = request.nextUrl.searchParams.get("audio_type") ?? "music";

  if (!accountId) {
    return NextResponse.json({ error: "account_id is required" }, { status: 400 });
  }

  const account = (
    await getOwnAccountTokens([accountId]).catch(() => null)
  )?.get(accountId);

  if (!account) {
    return NextResponse.json({ error: "Instagram account not found" }, { status: 404 });
  }

  const audioUrl = new URL(`${INSTAGRAM_GRAPH_BASE_URL}/${API_VERSION}/ig_audio`);
  audioUrl.searchParams.set("audio_type", audioType);
  audioUrl.searchParams.set("ig_user_id", account.instagramUserId);
  audioUrl.searchParams.set("access_token", account.accessToken);

  const audioResponse = await fetch(audioUrl);
  const audioBody = await audioResponse.json().catch(() => null);

  if (!audioResponse.ok) {
    return NextResponse.json(
      {
        error:
          audioBody?.error?.message ?? "Failed to load trending audio from Instagram",
      },
      { status: 502 }
    );
  }

  return NextResponse.json(audioBody);
}
