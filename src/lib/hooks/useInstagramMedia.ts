"use client";

import { useEffect, useState } from "react";

export interface InstagramMediaOption {
  id: string;
  caption: string | null;
  media_type: string;
  thumbnail_url: string | null;
  permalink: string | null;
  timestamp: string;
}

/** Loads the selected account's recent posts (or, with `kind: "story"`, its
 *  currently-live stories; `kind: "none"` skips fetching entirely, since
 *  there's no listing endpoint for Lives). One piece of state per fetch,
 *  tagged with the account+kind it belongs to, so a result for a previous
 *  selection is never shown against a new one. */
export function useInstagramMedia(
  accountId: string,
  kind: "post" | "story" | "none" = "post"
) {
  const [result, setResult] = useState<{
    key: string;
    items?: InstagramMediaOption[];
    error?: string;
  } | null>(null);

  const key = `${accountId}:${kind}`;

  useEffect(() => {
    if (!accountId || kind === "none") return;

    let cancelled = false;

    const url = new URL("/api/instagram/media", window.location.origin);
    url.searchParams.set("account_id", accountId);
    if (kind === "story") url.searchParams.set("type", "story");

    fetch(url)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok)
          throw new Error(
            body?.error ?? `Failed to load ${kind === "story" ? "stories" : "posts"}`
          );
        return body.items as InstagramMediaOption[];
      })
      .then((items) => {
        if (!cancelled) setResult({ key, items });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key,
            error:
              err instanceof Error
                ? err.message
                : `Failed to load ${kind === "story" ? "stories" : "posts"}`,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, kind, key]);

  const settled = result?.key === key ? result : null;

  return {
    items: settled?.items ?? [],
    error: settled?.error ?? null,
    loading: Boolean(accountId) && settled === null,
  };
}
