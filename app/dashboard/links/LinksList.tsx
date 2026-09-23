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
import { GripIcon, PencilIcon, PlusIcon, TrashIcon } from "../components/icons";
import { deleteLink, moveLink, reorderLinks, toggleLinkActive } from "./actions";
import { resolveLinkVisual } from "./linkTypeIcons";
import type { ProfileLink } from "@/lib/types";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function LinksList({
  links,
  brandColor,
}: {
  links: ProfileLink[];
  brandColor: string;
}) {
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
    if (!localOrder) return links;
    const byId = new Map(links.map((link) => [link.id, link]));
    const reordered = localOrder
      .map((id) => byId.get(id))
      .filter((link): link is ProfileLink => Boolean(link));
    const missing = links.filter((link) => !localOrder.includes(link.id));
    return [...reordered, ...missing];
  }, [links, localOrder]);

  useEffect(() => {
    if (toastShown.current) return;
    if (!searchParams.has("created") && !searchParams.has("updated")) return;
    toastShown.current = true;
    toast.success(searchParams.has("created") ? "Link added." : "Link updated.");
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return order;
    return order.filter(
      (link) =>
        link.title.toLowerCase().includes(query) || link.url.toLowerCase().includes(query)
    );
  }, [order, search]);

  async function handleToggle(id: string, title: string, nextActive: boolean) {
    try {
      await toggleLinkActive(id, nextActive);
      toast.success(`"${title}" ${nextActive ? "shown" : "hidden"} on your profile.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update link."));
    }
  }

  async function handleDelete(id: string, title: string) {
    try {
      await deleteLink(id);
      toast.success(`"${title}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete link."));
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    try {
      await moveLink(id, direction);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to reorder link."));
    }
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;

    const fromIndex = order.findIndex((link) => link.id === draggingId);
    const toIndex = order.findIndex((link) => link.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const nextIds = next.map((link) => link.id);
    const previousIds = order.map((link) => link.id);
    setLocalOrder(nextIds);
    setDraggingId(null);

    // Requests are chained (not fired in parallel) so a slow response can't land
    // after a later drop and stomp its order in the database.
    setPendingReorders((count) => count + 1);
    reorderQueueRef.current = reorderQueueRef.current
      .catch(() => {})
      .then(() => reorderLinks(nextIds))
      .catch((err) => {
        toast.error(errorMessage(err, "Failed to reorder link."));
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
        <SearchField value={search} onChange={setSearch} placeholder="Search links..." />
        <Link href="/dashboard/links/new" className={primaryButtonClass}>
          <PlusIcon className="h-4 w-4" />
          Add link
        </Link>
      </div>

      <ul className="flex flex-col gap-2.5">
        {filtered.map((link) => {
          const { customImageUrl, Icon, background } = resolveLinkVisual(link, brandColor);

          return (
            <li
              key={link.id}
              draggable
              onDragStart={() => setDraggingId(link.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(link.id)}
              onDragEnd={() => setDraggingId(null)}
              className={`flex items-center gap-3 rounded-2xl border border-black/6 bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-opacity dark:border-white/8 dark:bg-white/4 ${
                draggingId === link.id ? "opacity-40" : ""
              }`}
            >
              <span
                className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-zinc-300 active:cursor-grabbing dark:text-zinc-600"
                aria-hidden="true"
              >
                <GripIcon className="h-4 w-4" />
              </span>

              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white"
                style={{ background }}
              >
                {customImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
                  <img src={customImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{link.title}</p>
                  {link.is_featured && (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                      Featured
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-zinc-500">{link.url}</p>
              </div>

              <StatusBadge status={link.is_active ? "active" : "inactive"} />

              <div className="flex shrink-0 items-center gap-1">
                <form action={() => handleToggle(link.id, link.title, !link.is_active)}>
                  <ToggleSwitchButton isActive={link.is_active} />
                </form>

                <Link
                  href={`/dashboard/links/${link.id}/edit`}
                  title="Edit link"
                  aria-label={`Edit ${link.title}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>

                <ConfirmAction
                  action={() => handleDelete(link.id, link.title)}
                  title="Delete this link?"
                  description={`"${link.title}" will be removed from your profile.`}
                  confirmLabel="Delete"
                  trigger={
                    <button
                      type="button"
                      title="Delete link"
                      aria-label={`Delete ${link.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/15"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  }
                />

                <RowMenu
                  items={[
                    { label: "Move up", onSelect: () => handleMove(link.id, "up") },
                    { label: "Move down", onSelect: () => handleMove(link.id, "down") },
                    {
                      label: "Copy URL",
                      onSelect: () => {
                        navigator.clipboard.writeText(link.url);
                        toast.info("URL copied.");
                      },
                    },
                  ]}
                />
              </div>
            </li>
          );
        })}
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
      aria-label={isActive ? "Hide this link" : "Show this link"}
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
