import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LinkClickTargetType } from "@/types";

const TARGET_TYPES: LinkClickTargetType[] = [
  "profile_link",
  "lead_magnet",
  "product",
  "social",
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public, unauthenticated: fired via sendBeacon when a visitor clicks a
 *  link/lead-magnet/product/social on a public profile. RLS
 *  (`link_clicks_insert_public`) re-checks that the target is active and the
 *  profile is published, so this can't be abused to log clicks against
 *  arbitrary/unpublished targets. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { profileId, targetType, targetId } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof profileId !== "string" ||
    !UUID_PATTERN.test(profileId) ||
    typeof targetId !== "string" ||
    !UUID_PATTERN.test(targetId) ||
    typeof targetType !== "string" ||
    !TARGET_TYPES.includes(targetType as LinkClickTargetType)
  ) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const supabase = await createClient();
  // RLS silently rejects clicks against an inactive/unpublished target
  // rather than erroring — nothing for the visitor to see either way, but
  // logged so a misconfigured policy shows up in the server console.
  const { error } = await supabase.from("link_clicks").insert({
    profile_id: profileId,
    target_type: targetType,
    target_id: targetId,
    referrer: request.headers.get("referer"),
  });

  if (error) {
    console.error("[track-click] insert failed:", error.message, { profileId, targetType, targetId });
  }

  return new NextResponse(null, { status: 204 });
}
