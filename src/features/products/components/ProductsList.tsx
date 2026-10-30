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
  ListIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  StarIcon,
  TrashIcon,
} from "@/components/icons";
import {
  deleteProduct,
  deleteProducts,
  moveProduct,
  reorderProducts,
  toggleProductActive,
  toggleProductFeatured,
} from "@/features/products/actions";
import { displayFont, linkInBioGradientFor } from "@/lib/linkInBioTheme";
import { NewProductButton } from "./NewProductButton";
import { ProductFormModal } from "./ProductFormModal";
import type { Product } from "@/types";
import { saveViewPreference } from "@/lib/viewPreference/client";
import { VIEW_PREFERENCE_KEYS } from "@/lib/viewPreference/keys";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function formatPrice(price: number | null, currency: string) {
  if (price === null) return null;
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price);
}

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "active" | "hidden";

const VIEW_STORAGE_KEY = VIEW_PREFERENCE_KEYS.products;

export function ProductsList({
  products,
  initialView = "grid",
}: {
  products: Product[];
  initialView?: ViewMode;
}) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editProductId, setEditProductId] = useState<string | null>(null);
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
    if (!localOrder) return products;
    const byId = new Map(products.map((product) => [product.id, product]));
    const reordered = localOrder
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product));
    const missing = products.filter((product) => !localOrder.includes(product.id));
    return [...reordered, ...missing];
  }, [products, localOrder]);

  useEffect(() => {
    if (toastShown.current) return;
    if (!searchParams.has("created") && !searchParams.has("updated")) return;
    toastShown.current = true;
    toast.success(searchParams.has("created") ? "Product added." : "Product updated.");
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const counts = useMemo(
    () => ({
      all: order.length,
      active: order.filter((product) => product.is_active).length,
      hidden: order.filter((product) => !product.is_active).length,
    }),
    [order]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return order.filter((product) => {
      if (statusFilter === "active" && !product.is_active) return false;
      if (statusFilter === "hidden" && product.is_active) return false;
      if (!query) return true;
      return product.name.toLowerCase().includes(query);
    });
  }, [order, search, statusFilter]);

  async function handleToggleActive(id: string, name: string, nextActive: boolean) {
    try {
      await toggleProductActive(id, nextActive);
      toast.success(`"${name}" ${nextActive ? "shown" : "hidden"} on your profile.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update product."));
    }
  }

  async function handleToggleFeatured(id: string, name: string, nextFeatured: boolean) {
    try {
      await toggleProductFeatured(id, nextFeatured);
      toast.success(`"${name}" ${nextFeatured ? "featured" : "unfeatured"}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update product."));
    }
  }

  async function handleDelete(id: string, name: string) {
    setDeletingId(null);
    try {
      await deleteProduct(id);
      toast.success(`"${name}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete product."));
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
      await deleteProducts(ids);
      toast.success(`${ids.length} product${ids.length === 1 ? "" : "s"} deleted.`);
      setSelected(new Set());
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete products."));
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    try {
      await moveProduct(id, direction);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to reorder product."));
    }
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;

    const fromIndex = order.findIndex((product) => product.id === draggingId);
    const toIndex = order.findIndex((product) => product.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const nextIds = next.map((product) => product.id);
    const previousIds = order.map((product) => product.id);
    setLocalOrder(nextIds);
    setDraggingId(null);

    setPendingReorders((count) => count + 1);
    reorderQueueRef.current = reorderQueueRef.current
      .catch(() => {})
      .then(() => reorderProducts(nextIds))
      .catch((err) => {
        toast.error(errorMessage(err, "Failed to reorder product."));
        setLocalOrder(previousIds);
      })
      .finally(() => setPendingReorders((count) => count - 1));
  }

  // Only products still on the page count — a filter change or a delete
  // elsewhere can leave stale ids in the set.
  const selectedIds = filtered.filter((product) => selected.has(product.id)).map((product) => product.id);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const isEmptyCollection = products.length === 0;
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
              aria-label="Search products"
              placeholder="Search products"
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
          noun="product"
          allSelected={allSelected}
          onToggleAll={() =>
            setSelected(allSelected ? new Set() : new Set(filtered.map((product) => product.id)))
          }
          onClear={() => setSelected(new Set())}
          onDelete={() => handleBulkDelete(selectedIds)}
        />
      )}

      {view === "grid" && !isEmptyCollection && !isEmptyFiltered && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selected={selected.has(product.id)}
              onToggleSelected={() => toggleSelected(product.id)}
              confirmingDelete={deletingId === product.id}
              onAskDelete={() => setDeletingId(product.id)}
              onCancelDelete={() => setDeletingId(null)}
              onConfirmDelete={() => handleDelete(product.id, product.name)}
              onEdit={() => setEditProductId(product.id)}
              onToggleActive={() => handleToggleActive(product.id, product.name, !product.is_active)}
              onToggleFeatured={() =>
                handleToggleFeatured(product.id, product.name, !product.is_featured)
              }
              onMoveUp={() => handleMove(product.id, "up")}
              onMoveDown={() => handleMove(product.id, "down")}
            />
          ))}
        </div>
      )}

      {view === "list" && !isEmptyCollection && !isEmptyFiltered && (
        <div className="flex flex-col gap-3">
          {filtered.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              selected={selected.has(product.id)}
              onToggleSelected={() => toggleSelected(product.id)}
              draggable={!search && statusFilter === "all"}
              dragging={draggingId === product.id}
              onDragStart={() => setDraggingId(product.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(product.id)}
              onDragEnd={() => setDraggingId(null)}
              confirmingDelete={deletingId === product.id}
              onAskDelete={() => setDeletingId(product.id)}
              onCancelDelete={() => setDeletingId(null)}
              onConfirmDelete={() => handleDelete(product.id, product.name)}
              onEdit={() => setEditProductId(product.id)}
              onToggleActive={() => handleToggleActive(product.id, product.name, !product.is_active)}
              onToggleFeatured={() =>
                handleToggleFeatured(product.id, product.name, !product.is_featured)
              }
              onMoveUp={() => handleMove(product.id, "up")}
              onMoveDown={() => handleMove(product.id, "down")}
            />
          ))}
        </div>
      )}

      {(isEmptyCollection || isEmptyFiltered) && (
        <div className="flex flex-col items-center gap-4 rounded-[36px] border-[1.5px] border-dashed border-[var(--secondary-border)] bg-[var(--secondary-faint-bg)] px-7 py-14 text-center">
          <span className="animate-float flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[var(--violet)] text-white">
            <ShoppingBagIcon className="h-[34px] w-[34px]" />
          </span>
          <h3 className={`m-0 ${displayFont} text-[28px] font-extrabold tracking-[-0.03em]`}>
            {isEmptyCollection ? "No products yet" : "No products found"}
          </h3>
          <p className="m-0 max-w-[380px] text-[var(--muted)]">
            {isEmptyCollection
              ? "Showcase products, resources, or offers on your public profile."
              : "Try a different search term or status filter."}
          </p>
          {isEmptyCollection && (
            <NewProductButton className="inline-flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-full border-0 bg-[var(--accent)] px-7 font-bold text-white">
              <PlusIcon className="h-[18px] w-[18px]" />
              Add product
            </NewProductButton>
          )}
        </div>
      )}

      {editProductId && (
        <ProductFormModal
          productId={editProductId}
          onClose={() => setEditProductId(null)}
          onSaved={() => {
            setEditProductId(null);
            toast.success("Product updated.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Thumb({
  product,
  className,
  children,
}: {
  product: Product;
  className: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden text-white/90 ${className}`}
      style={{ background: linkInBioGradientFor(product.id) }}
    >
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
        <img src={product.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <ShoppingBagIcon className="h-7 w-7" />
      )}
      {children}
    </span>
  );
}

function FeaturedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#3B3560] ${className}`}
    >
      <StarIcon className="h-3 w-3 text-[var(--violet)]" />
      Featured
    </span>
  );
}

function ProductCard({
  product,
  selected,
  onToggleSelected,
  confirmingDelete,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  onEdit,
  onToggleActive,
  onToggleFeatured,
  onMoveUp,
  onMoveDown,
}: {
  product: Product;
  selected: boolean;
  onToggleSelected: () => void;
  confirmingDelete: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onToggleFeatured: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const priceLabel = formatPrice(product.price, product.currency);

  return (
    <div className="flex flex-col gap-3.5 rounded-[30px] border-[1.5px] border-[var(--line)] bg-white p-3.5 transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-[var(--secondary-border)] hover:shadow-[0_28px_46px_-30px_color-mix(in srgb, var(--secondary) 50%, transparent)]">
      <Thumb product={product} className="h-[170px] w-full rounded-[22px]">
        {product.is_featured && <FeaturedBadge className="absolute top-3 left-3" />}
        <span className="absolute bottom-3 left-3 w-fit rounded-full bg-[var(--ink)] px-3.5 py-1 font-extrabold text-white">
          {priceLabel ?? "No price"}
        </span>
      </Thumb>

      <div className="flex flex-col gap-2.5 px-1.5">
        <h3 className="m-0 [overflow-wrap:anywhere] text-[22px] leading-[1.15] font-extrabold tracking-[-0.02em]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex items-center gap-3">
            <SelectBox checked={selected} label={`Select ${product.name}`} onChange={onToggleSelected} />
            <StatusBadgePill isActive={product.is_active} />
          </span>
          <form action={onToggleActive}>
            <ActiveToggle
              isActive={product.is_active}
              label={product.is_active ? "Hide this product" : "Show this product"}
            />
          </form>
        </div>
      </div>

      {confirmingDelete ? (
        <DeleteConfirmBar
          label={`Delete "${product.name}"?`}
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      ) : (
        <div className="flex items-center gap-2 border-t border-[var(--line)] px-1.5 pt-3">
          <IconCircleButton label="Edit product" onClick={onEdit}>
            <PencilIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <IconCircleButton
            label={product.is_featured ? "Unfeature product" : "Feature product"}
            onClick={onToggleFeatured}
            tone="star"
          >
            <StarIcon className={`h-[17px] w-[17px] ${product.is_featured ? "" : "opacity-40"}`} />
          </IconCircleButton>
          <IconCircleButton label="Delete product" onClick={onAskDelete} tone="red">
            <TrashIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <span className="flex-1" />
          <LinkInBioRowMenu items={[{ label: "Move up", onSelect: onMoveUp }, { label: "Move down", onSelect: onMoveDown }]} />
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
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
  onToggleFeatured,
  onMoveUp,
  onMoveDown,
}: {
  product: Product;
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
  onToggleFeatured: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const priceLabel = formatPrice(product.price, product.currency);

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
      <SelectBox checked={selected} label={`Select ${product.name}`} onChange={onToggleSelected} />

      {draggable && (
        <span className="hidden h-8 w-5 shrink-0 cursor-grab items-center justify-center text-[#B9B4C7] active:cursor-grabbing sm:flex" aria-hidden="true">
          <GripIcon className="h-4 w-4" />
        </span>
      )}

      <Thumb product={product} className="h-[60px] w-[60px] rounded-[18px]" />

      <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="[overflow-wrap:anywhere] text-[17px] font-bold">{product.name}</span>
          {product.is_featured && <FeaturedBadge />}
        </div>
        <span className={`${displayFont} text-[16px] font-extrabold text-[var(--muted)]`}>
          {priceLabel ?? "No price"}
        </span>
      </div>

      <StatusBadgePill isActive={product.is_active} />

      <form action={onToggleActive}>
        <ActiveToggle
          isActive={product.is_active}
          label={product.is_active ? "Hide this product" : "Show this product"}
        />
      </form>

      {confirmingDelete ? (
        <DeleteConfirmBar label="Delete?" onCancel={onCancelDelete} onConfirm={onConfirmDelete} compact />
      ) : (
        <div className="flex items-center gap-2">
          <IconCircleButton label="Edit product" onClick={onEdit}>
            <PencilIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <IconCircleButton
            label={product.is_featured ? "Unfeature product" : "Feature product"}
            onClick={onToggleFeatured}
            tone="star"
          >
            <StarIcon className={`h-[17px] w-[17px] ${product.is_featured ? "" : "opacity-40"}`} />
          </IconCircleButton>
          <IconCircleButton label="Delete product" onClick={onAskDelete} tone="red">
            <TrashIcon className="h-[17px] w-[17px]" />
          </IconCircleButton>
          <LinkInBioRowMenu items={[{ label: "Move up", onSelect: onMoveUp }, { label: "Move down", onSelect: onMoveDown }]} />
        </div>
      )}
    </div>
  );
}
