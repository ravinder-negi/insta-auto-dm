"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertIcon } from "@/components/icons";

const ACCOUNTS_PATH = "/dashboard/accounts";

/** Shown across the dashboard while any account's Instagram token is dead,
 *  since its automations stop sending with no other visible sign. */
export function ReconnectBanner({ handles }: { handles: string[] }) {
  const pathname = usePathname();

  // The accounts page carries its own per-account reconnect prompt.
  if (handles.length === 0 || pathname === ACCOUNTS_PATH) return null;

  const names = handles.map((handle) => `@${handle}`).join(", ");

  return (
    <div
      role="alert"
      className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
      style={{
        borderColor: "var(--danger-border)",
        backgroundColor: "var(--danger-tint-faint)",
        color: "var(--danger-deep)",
      }}
    >
      <AlertIcon className="h-4.5 w-4.5 shrink-0" />
      <p className="min-w-0 flex-1">
        <span className="font-bold">Instagram disconnected {names}.</span>{" "}
        AutoDMs and DM Flows there are on hold until you reconnect.
      </p>
      <Link
        href={ACCOUNTS_PATH}
        className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold text-white"
        style={{ backgroundColor: "var(--danger-strong)" }}
      >
        Reconnect
      </Link>
    </div>
  );
}
