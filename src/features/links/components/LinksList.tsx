"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { LinkInBioRowMenu } from "@/components/ui/LinkInBioRowMenu";
import {
  ActiveToggle,
  BulkDeleteBar,
  DeleteConfirmBar,
  IconCircleButton,
  SelectBox,
  StatusBadgePill,
  StatusChip,
} from "@/components/ui/LinkInBioCollection";
import {
  GridIcon,
  GripIcon,
  LinkIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
} from "@/components/icons";
import { deleteLink, deleteLinks, moveLink, reorderLinks, toggleLinkActive } from "@/features/links/actions";
import { resolveLinkVisual } from "@/features/links/linkTypeIcons";
import { displayFont } from "@/lib/linkInBioTheme";
import { LinkFormModal } from "@/features/links/components/LinkFormModal";
import { NewLinkButton } from "@/features/links/components/NewLinkButton";
import type { ProfileLink } from "@/types";
import { saveViewPreference } from "@/lib/viewPreference/client";
import { VIEW_PREFERENCE_KEYS } from "@/lib/viewPreference/keys";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "hidden";

const VIEW_STORAGE_KEY = VIEW_PREFERENCE_KEYS.links;

function FeaturedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--warning-tint)] px-2.5 py-1 text-[11px] font-bold text-[var(--warning-text)]">
      <StarIcon className="h-3 w-3" />
      Featured
    </span>
  );
}

export function LinksList({
  links,
  brandColor,
  initialView = "grid",
}: {
  links: ProfileLink[];
  brandColor: string;
  initialView?: ViewMode;
}) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editLinkId, setEditLinkId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingReorders, setPendingReorders] = useState(0);
  const reorderQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [view, setView] = useState<ViewMode>(initialView);
  const [selected, setSelected] = useState<Set<string>>(new Set());


  function handleViewChange(next: ViewMode) {
    setView(next);
    saveViewPreference(VIEW_STORAGE_KEY, next);
  }

  const order = useMemo(() => {
    if (!localOrder) return links;
    const byId = new Map(links.map((link) => [link.id, link]));
    const reordered = localOrder.map((id) => byId.get(id)).filter((link): link is ProfileLink => Boolean(link));
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

  const counts = useMemo(
    () => ({
      all: order.length,
      active: order.filter((link) => link.is_active).length,
      hidden: order.filter((link) => !link.is_active).length,
    }),
    [order]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return order.filter((link) => {
      if (statusFilter === "active" && !link.is_active) return false;
      if (statusFilter === "hidden" && link.is_active) return false;
      if (!query) return true;
      return `${link.title} ${link.url}`.toLowerCase().includes(query);
    });
  }, [order, search, statusFilter]);

  async function handleToggle(id: string, title: string, nextActive: boolean) {
    try {
      await toggleLinkActive(id, nextActive);
      toast.success(`"${title}" ${nextActive ? "shown" : "hidden"} on your profile.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update link."));
    }
  }

  async function handleDelete(id: string, title: string) {
    setDeletingId(null);
    try {
      await deleteLink(id);
      toast.success(`"${title}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete link."));
    }
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete(ids: string[]) {
    try {
      await deleteLinks(ids);
      toast.success(`${ids.length} link${ids.length === 1 ? "" : "s"} deleted.`);
      setSelected(new Set());
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete links."));
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    try {
      await moveLink(id, direction);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to reorder link."));
    }
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    toast.info("URL copied.");
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

  // Only links still on the page count — a filter change or a delete
  // elsewhere can leave stale ids in the set.
  const selectedIds = filtered.filter((link) => selected.has(link.id)).map((link) => link.id);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const isEmptyCollection = links.length === 0;
  const isEmptyFiltered = !isEmptyCollection && filtered.length === 0;

  return (
    <div className="flex flex-col gap-5">
      {/* chips + toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2.5">
          <StatusChip
            label="All"
            dot="var(--neutral-dot)"
            count={counts.all}
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <StatusChip
            label="Active"
            dot="var(--success)"
            count={counts.active}
            active={statusFilter === "active"}
            onClick={() => setStatusFilter("active")}
          />
          <StatusChip
            label="Hidden"
            dot="var(--neutral-dot)"
            count={counts.hidden}
            active={statusFilter === "hidden"}
            onClick={() => setStatusFilter("hidden")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {pendingReorders > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--muted)]" />
              Saving order…
            </span>
          )}
          <div className="focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent)]/15 flex min-w-[200px] items-center gap-2.5 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4 transition-colors">
            <SearchIcon className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" />
            <input
              type="search"
              aria-label="Search links"
              placeholder="Search links"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-[46px] w-full border-0 bg-transparent outline-none placeholder:text-[var(--muted)]"
            />
          </div>
          <div className="inline-flex rounded-full border-[1.5px] border-[var(--line)] bg-white p-1">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => handleViewChange("grid")}
              className={`flex h-[38px] w-[42px] items-center justify-center rounded-full transition-colors ${
                view === "grid" ? "bg-[var(--ink)] text-white" : "text-[var(--ink)]"
              }`}
            >
              <GridIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => handleViewChange("list")}
              className={`flex h-[38px] w-[42px] items-center justify-center rounded-full transition-colors ${
                view === "list" ? "bg-[var(--ink)] text-white" : "text-[var(--ink)]"
              }`}
            >
              <ListIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <BulkDeleteBar
          count={selectedIds.length}
          noun="link"
          allSelected={allSelected}
          onToggleAll={() =>
            setSelected(allSelected ? new Set() : new Set(filtered.map((link) => link.id)))
          }
          onClear={() => setSelected(new Set())}
          onDelete={() => handleBulkDelete(selectedIds)}
        />
      )}

      {view === "grid" && !isEmptyCollection && !isEmptyFiltered && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              brandColor={brandColor}
              selected={selected.has(link.id)}
              onToggleSelected={() => toggleSelected(link.id)}
              confirmingDelete={deletingId === link.id}
              onAskDelete={() => setDeletingId(link.id)}
              onCancelDelete={() => setDeletingId(null)}
              onConfirmDelete={() => handleDelete(link.id, link.title)}
              onEdit={() => setEditLinkId(link.id)}
              onToggleActive={() => handleToggle(link.id, link.title, !link.is_active)}
              onMoveUp={() => handleMove(link.id, "up")}
              onMoveDown={() => handleMove(link.id, "down")}
              onCopy={() => handleCopy(link.url)}
            />
          ))}
        </div>
      )}

      {view === "list" && !isEmptyCollection && !isEmptyFiltered && (
        <div className="flex flex-col gap-3">
          {filtered.map((link) => (
            <LinkRow
              key={link.id}
              link={link}
              brandColor={brandColor}
              selected={selected.has(link.id)}
              onToggleSelected={() => toggleSelected(link.id)}
              draggable={!search && statusFilter === "all"}
              dragging={draggingId === link.id}
              onDragStart={() => setDraggingId(link.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(link.id)}
              onDragEnd={() => setDraggingId(null)}
              confirmingDelete={deletingId === link.id}
              onAskDelete={() => setDeletingId(link.id)}
              onCancelDelete={() => setDeletingId(null)}
              onConfirmDelete={() => handleDelete(link.id, link.title)}
              onEdit={() => setEditLinkId(link.id)}
              onToggleActive={() => handleToggle(link.id, link.title, !link.is_active)}
              onMoveUp={() => handleMove(link.id, "up")}
              onMoveDown={() => handleMove(link.id, "down")}
              onCopy={() => handleCopy(link.url)}
            />
          ))}
        </div>
      )}

      {(isEmptyCollection || isEmptyFiltered) && (
        <div className="flex flex-col items-center gap-4 rounded-[36px] border-[1.5px] border-dashed border-[var(--secondary-border)] bg-[var(--secondary-faint-bg)] px-7 py-14 text-center">
          <span className="animate-float flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[var(--violet)] text-white">
            <LinkIcon className="h-[34px] w-[34px]" />
          </span>
          <h3 className={`m-0 ${displayFont} text-[28px] font-extrabold tracking-[-0.03em]`}>
            {isEmptyCollection ? "No links yet" : "No links found"}
          </h3>
          <p className="m-0 max-w-[380px] text-[var(--muted)]">
            {isEmptyCollection
              ? "Add a website, YouTube channel, blog, product, or custom page to your profile."
              : "Try a different search term or status filter."}
          </p>
          {isEmptyCollection && (
            <NewLinkButton className="inline-flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-full border-0 bg-[var(--accent)] px-7 font-bold text-white">
              <PlusIcon className="h-[18px] w-[18px]" />
              Add your first link
            </NewLinkButton>
          )}
        </div>
      )}

      {editLinkId && (
        <LinkFormModal
          linkId={editLinkId}
          onClose={() => setEditLinkId(null)}
          onSaved={() => {
            setEditLinkId(null);
            toast.success("Link updated.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function LinkThumb({
  link,
  brandColor,
  className,
}: {
  link: ProfileLink;
  brandColor: string;
  className: string;
}) {
  const { customImageUrl, Icon, background } = resolveLinkVisual(link, brandColor);
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden text-white ${className}`}
      style={{ background }}
    >
      {customImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
        <img src={customImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <Icon className="h-5 w-5" />
      )}
    </span>
  );
}

function LinkCard({
  link,
  brandColor,
  selected,
  onToggleSelected,
  confirmingDelete,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  onEdit,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  onCopy,
}: {
  link: ProfileLink;
  brandColor: string;
  selected: boolean;
  onToggleSelected: () => void;
  confirmingDelete: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[30px] border-[1.5px] border-[var(--line)] bg-white p-3.5 transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-[var(--secondary-border)] hover:shadow-[0_28px_46px_-30px_color-mix(in srgb, var(--secondary) 50%, transparent)]">
      <div className="flex items-center gap-3.5 px-1.5 pt-1.5">
        <LinkThumb link={link} brandColor={brandColor} className="h-[46px] w-[46px] rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="m-0 truncate text-[17px] leading-tight font-extrabold tracking-[-0.01em]">
              {link.title}
            </h3>
            {link.is_featured && <FeaturedBadge />}
          </div>
          <p className="m-0 truncate text-xs text-[var(--muted)]">{link.url}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2.5 px-1.5">
        <span className="flex items-center gap-3">
          <SelectBox checked={selected} label={`Select ${link.title}`} onChange={onToggleSelected} />
          <StatusBadgePill isActive={link.is_active} />
        </span>
        <form action={onToggleActive}>
          <ActiveToggle
            isActive={link.is_active}
            label={link.is_active ? "Hide this link" : "Show this link"}
          />
        </form>
      </div>

      {confirmingDelete ? (
        <DeleteConfirmBar
          label={`Delete "${link.title}"?`}
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      ) : (
        <div className="flex items-center gap-2 border-t border-[var(--line)] px-1.5 pt-3">
          <IconCircleButton label="Edit link" onClick={onEdit}>
            <PencilIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <IconCircleButton label="Delete link" onClick={onAskDelete} tone="red">
            <TrashIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <span className="flex-1" />
          <LinkInBioRowMenu
            items={[
              { label: "Move up", onSelect: onMoveUp },
              { label: "Move down", onSelect: onMoveDown },
              { label: "Copy URL", onSelect: onCopy },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function LinkRow({
  link,
  brandColor,
  selected,
  onToggleSelected,
  draggable,
  dragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  confirmingDelete,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  onEdit,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  onCopy,
}: {
  link: ProfileLink;
  brandColor: string;
  selected: boolean;
  onToggleSelected: () => void;
  draggable: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  confirmingDelete: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCopy: () => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex flex-wrap items-center gap-3 rounded-[24px] border-[1.5px] border-[var(--line)] bg-white p-3 pr-4.5 transition-[box-shadow,border-color,opacity] hover:border-[var(--secondary-border)] hover:shadow-[0_20px_36px_-28px_color-mix(in srgb, var(--secondary) 50%, transparent)] ${
        dragging ? "opacity-40" : ""
      }`}
    >
      <SelectBox checked={selected} label={`Select ${link.title}`} onChange={onToggleSelected} />

      {draggable && (
        <span className="hidden h-8 w-5 shrink-0 cursor-grab items-center justify-center text-[#B9B4C7] active:cursor-grabbing sm:flex" aria-hidden="true">
          <GripIcon className="h-4 w-4" />
        </span>
      )}

      <LinkThumb link={link} brandColor={brandColor} className="h-[46px] w-[46px] rounded-2xl" />

      <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[17px] font-bold">{link.title}</span>
          {link.is_featured && <FeaturedBadge />}
        </div>
        <span className="truncate text-sm text-[var(--muted)]">{link.url}</span>
      </div>

      <StatusBadgePill isActive={link.is_active} />

      <form action={onToggleActive}>
        <ActiveToggle isActive={link.is_active} label={link.is_active ? "Hide this link" : "Show this link"} />
      </form>

      {confirmingDelete ? (
        <DeleteConfirmBar label="Delete?" onCancel={onCancelDelete} onConfirm={onConfirmDelete} compact />
      ) : (
        <div className="flex items-center gap-2">
          <IconCircleButton label="Edit link" onClick={onEdit}>
            <PencilIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <IconCircleButton label="Delete link" onClick={onAskDelete} tone="red">
            <TrashIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <LinkInBioRowMenu
            items={[
              { label: "Move up", onSelect: onMoveUp },
              { label: "Move down", onSelect: onMoveDown },
              { label: "Copy URL", onSelect: onCopy },
            ]}
          />
        </div>
      )}
    </div>
  );
}
