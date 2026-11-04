/**
 * What each storage bucket accepts. The same limits are enforced by the
 * buckets themselves (file_size_limit / allowed_mime_types, see
 * supabase/migrations/..._storage_upload_limits.sql); checking here too just
 * gives a friendly message before the upload starts.
 *
 * Keys are MIME types, values the extension the stored file gets — derived
 * from the type, never from the user's filename.
 */
const IMAGE_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

const LEAD_MAGNET_TYPES = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/epub+zip": "epub",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  ...IMAGE_TYPES,
} as const;

const MB = 1024 * 1024;

export const UPLOAD_RULES = {
  avatars: { maxBytes: 5 * MB, types: IMAGE_TYPES, kinds: "a PNG, JPG or WebP image" },
  "link-icons": { maxBytes: 2 * MB, types: IMAGE_TYPES, kinds: "a PNG, JPG or WebP image" },
  "product-images": { maxBytes: 5 * MB, types: IMAGE_TYPES, kinds: "a PNG, JPG or WebP image" },
  "lead-magnets": {
    maxBytes: 20 * MB,
    types: LEAD_MAGNET_TYPES,
    kinds: "a PDF, ZIP, EPUB, Word, Excel, PowerPoint, text or image file",
  },
} as const;

export type UploadBucket = keyof typeof UPLOAD_RULES;

/** Value for an <input type="file" accept>: MIME types plus extensions, since
 *  some systems report no type for e.g. .epub or .docx. */
export function acceptFor(bucket: UploadBucket): string {
  const types = UPLOAD_RULES[bucket].types;
  const extensions = [...new Set(Object.values(types))].map((ext) => `.${ext}`);
  return [...Object.keys(types), ...extensions].join(",");
}

/** Validates a picked file for a bucket and works out the Content-Type and
 *  extension to store it with. `noun` is used in the messages ("Photo must
 *  be 5MB or smaller."). */
export function prepareUpload(
  bucket: UploadBucket,
  file: File,
  noun: string
): { ok: true; contentType: string; ext: string } | { ok: false; error: string } {
  const { maxBytes, types, kinds } = UPLOAD_RULES[bucket];
  const byType = types as Record<string, string>;

  if (file.size > maxBytes) {
    return { ok: false, error: `${noun} must be ${maxBytes / MB}MB or smaller.` };
  }

  let contentType = file.type;
  if (!contentType) {
    // No type reported (common for .epub/.docx on some systems): fall back to
    // the filename's extension, but only to an allowed type.
    const nameExt = file.name.split(".").pop()?.toLowerCase();
    contentType = Object.keys(byType).find((type) => byType[type] === nameExt) ?? "";
  }

  const ext = byType[contentType];
  if (!ext) {
    return { ok: false, error: `${noun} must be ${kinds}.` };
  }
  return { ok: true, contentType, ext };
}
