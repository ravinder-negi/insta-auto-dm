"use client";

import Link from "next/link";
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
  DocumentIcon,
  GiftIcon,
  GridIcon,
  GripIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import {
  deleteLeadMagnet,
  deleteLeadMagnets,
  moveLeadMagnet,
  reorderLeadMagnets,
  toggleLeadMagnetActive,
} from "@/features/lead-magnets/actions";
import { displayFont, linkInBioGradientFor } from "@/lib/linkInBioTheme";
import { LeadMagnetFormModal } from "./LeadMagnetFormModal";
import { NewLeadMagnetButton } from "./NewLeadMagnetButton";
import { saveViewPreference } from "@/lib/viewPreference/client";
import { VIEW_PREFERENCE_KEYS } from "@/lib/viewPreference/keys";

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

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "hidden";

const VIEW_STORAGE_KEY = VIEW_PREFERENCE_KEYS.leadMagnets;

export function LeadMagnetsList({
  leadMagnets,
  initialView = "grid",
}: {
  leadMagnets: LeadMagnetRow[];
  initialView?: ViewMode;
}) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editMagnetId, setEditMagnetId] = useState<string | null>(null);
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

  const counts = useMemo(
    () => ({
      all: order.length,
      active: order.filter((magnet) => magnet.is_active).length,
      hidden: order.filter((magnet) => !magnet.is_active).length,
    }),
    [order]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return order.filter((magnet) => {
      if (statusFilter === "active" && !magnet.is_active) return false;
      if (statusFilter === "hidden" && magnet.is_active) return false;
      if (!query) return true;
      return magnet.title.toLowerCase().includes(query);
    });
  }, [order, search, statusFilter]);

  async function handleToggle(id: string, title: string, nextActive: boolean) {
    try {
      await toggleLeadMagnetActive(id, nextActive);
      toast.success(`"${title}" ${nextActive ? "shown" : "hidden"} on your profile.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update lead magnet."));
    }
  }

  async function handleDelete(id: string, title: string) {
    setDeletingId(null);
    try {
      await deleteLeadMagnet(id);
      toast.success(`"${title}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete lead magnet."));
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
      await deleteLeadMagnets(ids);
      toast.success(`${ids.length} lead magnet${ids.length === 1 ? "" : "s"} deleted.`);
      setSelected(new Set());
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete lead magnets."));
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

  // Only lead magnets still on the page count — a filter change or a delete
  // elsewhere can leave stale ids in the set.
  const selectedIds = filtered.filter((magnet) => selected.has(magnet.id)).map((magnet) => magnet.id);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const isEmptyCollection = leadMagnets.length === 0;
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
              aria-label="Search lead magnets"
              placeholder="Search lead magnets"
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
          noun="lead magnet"
          allSelected={allSelected}
          onToggleAll={() =>
            setSelected(allSelected ? new Set() : new Set(filtered.map((magnet) => magnet.id)))
          }
          onClear={() => setSelected(new Set())}
          onDelete={() => handleBulkDelete(selectedIds)}
        />
      )}

      {view === "grid" && !isEmptyCollection && !isEmptyFiltered && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((magnet) => (
            <MagnetCard
              key={magnet.id}
              magnet={magnet}
              selected={selected.has(magnet.id)}
              onToggleSelected={() => toggleSelected(magnet.id)}
              confirmingDelete={deletingId === magnet.id}
              onAskDelete={() => setDeletingId(magnet.id)}
              onCancelDelete={() => setDeletingId(null)}
              onConfirmDelete={() => handleDelete(magnet.id, magnet.title)}
              onEdit={() => setEditMagnetId(magnet.id)}
              onToggleActive={() => handleToggle(magnet.id, magnet.title, !magnet.is_active)}
              onMoveUp={() => handleMove(magnet.id, "up")}
              onMoveDown={() => handleMove(magnet.id, "down")}
            />
          ))}
        </div>
      )}

      {view === "list" && !isEmptyCollection && !isEmptyFiltered && (
        <div className="flex flex-col gap-3">
          {filtered.map((magnet) => (
            <MagnetRow
              key={magnet.id}
              magnet={magnet}
              selected={selected.has(magnet.id)}
              onToggleSelected={() => toggleSelected(magnet.id)}
              draggable={!search && statusFilter === "all"}
              dragging={draggingId === magnet.id}
              onDragStart={() => setDraggingId(magnet.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(magnet.id)}
              onDragEnd={() => setDraggingId(null)}
              confirmingDelete={deletingId === magnet.id}
              onAskDelete={() => setDeletingId(magnet.id)}
              onCancelDelete={() => setDeletingId(null)}
              onConfirmDelete={() => handleDelete(magnet.id, magnet.title)}
              onEdit={() => setEditMagnetId(magnet.id)}
              onToggleActive={() => handleToggle(magnet.id, magnet.title, !magnet.is_active)}
              onMoveUp={() => handleMove(magnet.id, "up")}
              onMoveDown={() => handleMove(magnet.id, "down")}
            />
          ))}
        </div>
      )}

      {(isEmptyCollection || isEmptyFiltered) && (
        <div className="flex flex-col items-center gap-4 rounded-[36px] border-[1.5px] border-dashed border-[var(--secondary-border)] bg-[var(--secondary-faint-bg)] px-7 py-14 text-center">
          <span className="animate-float flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[var(--violet)] text-white">
            <GiftIcon className="h-[34px] w-[34px]" />
          </span>
          <h3 className={`m-0 ${displayFont} text-[28px] font-extrabold tracking-[-0.03em]`}>
            {isEmptyCollection ? "No lead magnets yet" : "No lead magnets found"}
          </h3>
          <p className="m-0 max-w-[380px] text-[var(--muted)]">
            {isEmptyCollection
              ? "Offer a PDF, ebook, template, or guide to grow your email list."
              : "Try a different search term or status filter."}
          </p>
          {isEmptyCollection && (
            <NewLeadMagnetButton className="inline-flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-full border-0 bg-[var(--accent)] px-7 font-bold text-white">
              <PlusIcon className="h-[18px] w-[18px]" />
              Add your first lead magnet
            </NewLeadMagnetButton>
          )}
        </div>
      )}

      {editMagnetId && (
        <LeadMagnetFormModal
          leadMagnetId={editMagnetId}
          onClose={() => setEditMagnetId(null)}
          onSaved={() => {
            setEditMagnetId(null);
            toast.success("Lead magnet updated.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Tile({ id, className }: { id: string; className: string }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden text-white/90 ${className}`}
      style={{ background: linkInBioGradientFor(id) }}
    >
      <DocumentIcon className="h-7 w-7" />
    </span>
  );
}

function LeadCountLink({ id, leadCount }: { id: string; leadCount: number }) {
  return (
    <Link
      href={`/dashboard/lead-magnets/${id}/leads`}
      className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--tint2)] px-2.5 py-1 text-xs font-bold text-[#3B3560] hover:underline"
    >
      {leadCount} {leadCount === 1 ? "lead" : "leads"}
    </Link>
  );
}

function MagnetCard({
  magnet,
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
}: {
  magnet: LeadMagnetRow;
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
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[30px] border-[1.5px] border-[var(--line)] bg-white p-3.5 transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-[var(--secondary-border)] hover:shadow-[0_28px_46px_-30px_color-mix(in srgb, var(--secondary) 50%, transparent)]">
      <Tile id={magnet.id} className="h-[120px] w-full rounded-[22px]" />

      <div className="flex flex-col gap-2.5 px-1.5">
        <h3 className="m-0 [overflow-wrap:anywhere] text-[20px] leading-[1.15] font-extrabold tracking-[-0.02em]">
          {magnet.title}
        </h3>
        <p className="m-0 truncate text-sm text-[var(--muted)]">{magnet.file_name ?? "File"}</p>
        <LeadCountLink id={magnet.id} leadCount={magnet.leadCount} />
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex items-center gap-3">
            <SelectBox checked={selected} label={`Select ${magnet.title}`} onChange={onToggleSelected} />
            <StatusBadgePill isActive={magnet.is_active} />
          </span>
          <form action={onToggleActive}>
            <ActiveToggle
              isActive={magnet.is_active}
              label={magnet.is_active ? "Hide this lead magnet" : "Show this lead magnet"}
            />
          </form>
        </div>
      </div>

      {confirmingDelete ? (
        <DeleteConfirmBar
          label={`Delete "${magnet.title}"?`}
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      ) : (
        <div className="flex items-center gap-2 border-t border-[var(--line)] px-1.5 pt-3">
          <IconCircleButton label="Edit lead magnet" onClick={onEdit}>
            <PencilIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <IconCircleButton label="Delete lead magnet" onClick={onAskDelete} tone="red">
            <TrashIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <span className="flex-1" />
          <LinkInBioRowMenu items={[{ label: "Move up", onSelect: onMoveUp }, { label: "Move down", onSelect: onMoveDown }]} />
        </div>
      )}
    </div>
  );
}

function MagnetRow({
  magnet,
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
}: {
  magnet: LeadMagnetRow;
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
      <SelectBox checked={selected} label={`Select ${magnet.title}`} onChange={onToggleSelected} />

      {draggable && (
        <span className="hidden h-8 w-5 shrink-0 cursor-grab items-center justify-center text-[#B9B4C7] active:cursor-grabbing sm:flex" aria-hidden="true">
          <GripIcon className="h-4 w-4" />
        </span>
      )}

      <Tile id={magnet.id} className="h-[60px] w-[60px] rounded-[18px]" />

      <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
        <span className="[overflow-wrap:anywhere] text-[17px] font-bold">{magnet.title}</span>
        <span className="truncate text-sm text-[var(--muted)]">{magnet.file_name ?? "File"}</span>
      </div>

      <LeadCountLink id={magnet.id} leadCount={magnet.leadCount} />
      <StatusBadgePill isActive={magnet.is_active} />

      <form action={onToggleActive}>
        <ActiveToggle
          isActive={magnet.is_active}
          label={magnet.is_active ? "Hide this lead magnet" : "Show this lead magnet"}
        />
      </form>

      {confirmingDelete ? (
        <DeleteConfirmBar label="Delete?" onCancel={onCancelDelete} onConfirm={onConfirmDelete} compact />
      ) : (
        <div className="flex items-center gap-2">
          <IconCircleButton label="Edit lead magnet" onClick={onEdit}>
            <PencilIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <IconCircleButton label="Delete lead magnet" onClick={onAskDelete} tone="red">
            <TrashIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <LinkInBioRowMenu items={[{ label: "Move up", onSelect: onMoveUp }, { label: "Move down", onSelect: onMoveDown }]} />
        </div>
      )}
    </div>
  );
}
