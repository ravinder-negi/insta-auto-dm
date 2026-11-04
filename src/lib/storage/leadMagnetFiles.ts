import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "lead-magnets";
const PUBLIC_PATH_PREFIX = `/storage/v1/object/public/${BUCKET}/`;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Turns a stored lead-magnet file_url into a link a visitor can download.
 *
 * The lead-magnets bucket is private, so a file uploaded to it (stored as
 * its public-style URL, see LeadMagnetForm) gets a short-lived signed URL.
 * A file_url pointing anywhere else (e.g. a Google Drive link the creator
 * pasted) is returned unchanged.
 */
export async function leadMagnetDownloadUrl(fileUrl: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return null;
  }

  const storageHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
  if (parsed.host !== storageHost || !parsed.pathname.startsWith(PUBLIC_PATH_PREFIX)) {
    return fileUrl;
  }

  const path = decodeURIComponent(parsed.pathname.slice(PUBLIC_PATH_PREFIX.length));
  const { data, error } = await createAdminClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.error("[leadMagnetDownloadUrl] signing failed:", error?.message);
    return null;
  }
  return data.signedUrl;
}
