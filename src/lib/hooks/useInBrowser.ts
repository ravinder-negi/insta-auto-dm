"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False while the page is server-rendered (and during hydration), true once
 *  running in the browser. For things that need `document`, like portals
 *  that must render on first load. */
export function useInBrowser(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
