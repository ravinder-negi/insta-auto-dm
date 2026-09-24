"use client";

import { useState } from "react";
import { LinkInBioPreview, type PreviewLink } from "../components/LinkInBioPreview";
import { DesktopIcon, MobileIcon } from "../components/icons";

export function LinksPreview({
  brandColor,
  avatarUrl,
  displayName,
  username,
  bio,
  links,
}: {
  brandColor: string;
  avatarUrl: string | null;
  displayName: string | null;
  username: string | null;
  bio: string | null;
  links: PreviewLink[];
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("mobile");

  return (
    <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/8 dark:bg-white/4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5 rounded-lg border border-black/8 p-1 dark:border-white/10">
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            aria-pressed={device === "mobile"}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              device === "mobile"
                ? "bg-brand-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
            }`}
          >
            <MobileIcon className="h-4 w-4" />
            Mobile view
          </button>
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            aria-pressed={device === "desktop"}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              device === "desktop"
                ? "bg-brand-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
            }`}
          >
            <DesktopIcon className="h-4 w-4" />
            Desktop view
          </button>
        </div>
      </div>

      <div className={`mx-auto mt-5 ${device === "mobile" ? "max-w-70" : "max-w-full"}`}>
        <LinkInBioPreview
          brandColor={brandColor}
          avatarUrl={avatarUrl}
          displayName={displayName}
          username={username}
          bio={bio}
          links={links}
          bezel={device === "mobile"}
        />
      </div>
    </div>
  );
}
