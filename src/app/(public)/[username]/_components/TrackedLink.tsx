"use client";

import type { AnchorHTMLAttributes } from "react";
import type { LinkClickTargetType } from "@/types";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  profileId: string;
  targetType: LinkClickTargetType;
  targetId: string;
};

/** A visitor-facing `<a>` that logs a click before/while navigating away.
 *  Uses sendBeacon so the log fires without delaying or blocking the
 *  (usually new-tab) navigation the href already triggers. */
export function TrackedLink({
  profileId,
  targetType,
  targetId,
  onClick,
  ...anchorProps
}: TrackedLinkProps) {
  return (
    <a
      {...anchorProps}
      onClick={(event) => {
        const payload = JSON.stringify({ profileId, targetType, targetId });
        if (typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon("/api/track-click", new Blob([payload], { type: "application/json" }));
        } else {
          fetch("/api/track-click", { method: "POST", body: payload, keepalive: true }).catch(
            () => {}
          );
        }
        onClick?.(event);
      }}
    />
  );
}
