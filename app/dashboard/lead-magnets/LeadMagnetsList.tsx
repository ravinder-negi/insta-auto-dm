"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ConfirmAction } from "../components/ConfirmAction";
import { RowMenu } from "../components/RowMenu";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { SearchField } from "../components/controls";
import { primaryButtonClass } from "../components/styles";
import { DocumentIcon, GripIcon, PencilIcon, PlusIcon, TrashIcon } from "../components/icons";
import {
  deleteLeadMagnet,
  moveLeadMagnet,
  reorderLeadMagnets,
  toggleLeadMagnetActive,
} from "./actions";

export interface LeadMagnetRow {
  id: string;
  title: string;
  file_name: string | null;
  is_active: boolean;
  leadCount: number;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function LeadMagnetsList({ leadMagnets }: { leadMagnets: LeadMagnetRow[] }) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  const [search, setSearch] = useState("");
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingReorders, setPendingReorders] = useState(0);
  const reorderQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  const order = useMemo(() => {
    if (!localOrder) return leadMagnets;
    const byId = new Map(leadMagnets.map((magnet) => [magnet.id, magnet]));
    const reordered = localOrder
      .map((id) => byId.get(id))
      .filter((magnet): magnet is LeadMagnetRow => Boolean(magnet));
    const missing = leadMagnets.filter((magnet) => !localOrder.includes(magnet.id));
    return [...reordered, ...missing];
  }, [leadMagnets, localOrder]);

  useEffect(() => {
    if (toastShown.current) return;
    if (!searchParams.has("created") && !searchParams.has("updated")) return;
    toastShown.current = true;
    toast.success(searchParams.has("created") ? "Lead magnet added." : "Lead magnet updated.");
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return order;
    return order.filter((magnet) => magnet.title.toLowerCase().includes(query));
  }, [order, search]);

  async function handleToggle(id: string, title: string, nextActive: boolean) {
    try {
      await toggleLeadMagnetActive(id, nextActive);
      toast.success(`"${title}" ${nextActive ? "shown" : "hidden"} on your profile.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update lead magnet."));
    }
  }

  async function handleDelete(id: string, title: string) {
    try {
      await deleteLeadMagnet(id);
      toast.success(`"${title}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete lead magnet."));
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    try {
      await moveLeadMagnet(id, direction);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to reorder lead magnet."));
    }
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;

    const fromIndex = order.findIndex((magnet) => magnet.id === draggingId);
    const toIndex = order.findIndex((magnet) => magnet.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const nextIds = next.map((magnet) => magnet.id);
    const previousIds = order.map((magnet) => magnet.id);
    setLocalOrder(nextIds);
    setDraggingId(null);

    setPendingReorders((count) => count + 1);
    reorderQueueRef.current = reorderQueueRef.current
      .catch(() => {})
      .then(() => reorderLeadMagnets(nextIds))
      .catch((err) => {
        toast.error(errorMessage(err, "Failed to reorder lead magnet."));
        setLocalOrder(previousIds);
      })
      .finally(() => setPendingReorders((count) => count - 1));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {pendingReorders > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-500 dark:border-zinc-600 dark:border-t-zinc-300" />
            Saving order…
          </span>
        )}
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search lead magnets..."
        />
        <Link href="/dashboard/lead-magnets/new" className={primaryButtonClass}>
          <PlusIcon className="h-4 w-4" />
          Add lead magnet
        </Link>
      </div>

      <ul className="flex flex-col gap-2.5">
        {filtered.map((magnet) => (
          <li
            key={magnet.id}
            draggable
            onDragStart={() => setDraggingId(magnet.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(magnet.id)}
            onDragEnd={() => setDraggingId(null)}
            className={`flex items-center gap-3 rounded-2xl border border-black/6 bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-opacity dark:border-white/8 dark:bg-white/4 ${
              draggingId === magnet.id ? "opacity-40" : ""
            }`}
          >
            <span
              className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-zinc-300 active:cursor-grabbing dark:text-zinc-600"
              aria-hidden="true"
            >
              <GripIcon className="h-4 w-4" />
            </span>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
              <DocumentIcon className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{magnet.title}</p>
              <p className="truncate text-xs text-zinc-500">
                {magnet.file_name ?? "File"}
              </p>
            </div>

            <Link
              href={`/dashboard/lead-magnets/${magnet.id}/leads`}
              className="shrink-0 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {magnet.leadCount} {magnet.leadCount === 1 ? "lead" : "leads"}
            </Link>

            <StatusBadge status={magnet.is_active ? "active" : "inactive"} />

            <div className="flex shrink-0 items-center gap-1">
              <form action={() => handleToggle(magnet.id, magnet.title, !magnet.is_active)}>
                <ToggleSwitchButton isActive={magnet.is_active} />
              </form>

              <Link
                href={`/dashboard/lead-magnets/${magnet.id}/edit`}
                title="Edit lead magnet"
                aria-label={`Edit ${magnet.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
              >
                <PencilIcon className="h-4 w-4" />
              </Link>

              <ConfirmAction
                action={() => handleDelete(magnet.id, magnet.title)}
                title="Delete this lead magnet?"
                description={`"${magnet.title}" and its captured leads will be removed.`}
                confirmLabel="Delete"
                trigger={
                  <button
                    type="button"
                    title="Delete lead magnet"
                    aria-label={`Delete ${magnet.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/15"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                }
              />

              <RowMenu
                items={[
                  { label: "Move up", onSelect: () => handleMove(magnet.id, "up") },
                  { label: "Move down", onSelect: () => handleMove(magnet.id, "down") },
                ]}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToggleSwitchButton({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="switch"
      aria-checked={isActive}
      disabled={pending}
      aria-label={isActive ? "Hide this lead magnet" : "Show this lead magnet"}
      title={isActive ? "Hide from profile" : "Show on profile"}
      className={`relative flex h-6 w-11 items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
        isActive ? "brand-gradient" : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      {pending ? (
        <span className="mx-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/60 border-t-white" />
      ) : (
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
            isActive ? "translate-x-5" : "translate-x-0"
          }`}
        />
      )}
    </button>
  );
}
