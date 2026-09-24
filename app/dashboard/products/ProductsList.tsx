"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ConfirmAction } from "../components/ConfirmAction";
import { RowMenu } from "../components/RowMenu";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { SearchField, SelectField } from "../components/controls";
import { primaryButtonClass } from "../components/styles";
import {
  GripIcon,
  PencilIcon,
  PlusIcon,
  ShoppingBagIcon,
  StarIcon,
  TrashIcon,
} from "../components/icons";
import {
  deleteProduct,
  moveProduct,
  reorderProducts,
  toggleProductActive,
  toggleProductFeatured,
} from "./actions";
import type { Product } from "@/lib/types";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function formatPrice(price: number | null, currency: string) {
  if (price === null) return null;
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price);
}

export function ProductsList({ products }: { products: Product[] }) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastShown = useRef(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingReorders, setPendingReorders] = useState(0);
  const reorderQueueRef = useRef<Promise<unknown>>(Promise.resolve());

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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return order.filter((product) => {
      if (statusFilter === "active" && !product.is_active) return false;
      if (statusFilter === "inactive" && product.is_active) return false;
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
    try {
      await deleteProduct(id);
      toast.success(`"${name}" deleted.`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete product."));
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {pendingReorders > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-500 dark:border-zinc-600 dark:border-t-zinc-300" />
            Saving order…
          </span>
        )}
        <SearchField value={search} onChange={setSearch} placeholder="Search products..." />
        <SelectField
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | "active" | "inactive")
          }
          aria-label="Filter by status"
          className="sm:w-40"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </SelectField>
        <Link href="/dashboard/products/new" className={primaryButtonClass}>
          <PlusIcon className="h-4 w-4" />
          Add product
        </Link>
      </div>

      <ul className="flex flex-col gap-2.5">
        {filtered.map((product) => {
          const priceLabel = formatPrice(product.price, product.currency);

          return (
            <li
              key={product.id}
              draggable
              onDragStart={() => setDraggingId(product.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(product.id)}
              onDragEnd={() => setDraggingId(null)}
              className={`flex items-center gap-3 rounded-2xl border border-black/6 bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-opacity dark:border-white/8 dark:bg-white/4 ${
                draggingId === product.id ? "opacity-40" : ""
              }`}
            >
              <span
                className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-zinc-300 active:cursor-grabbing dark:text-zinc-600"
                aria-hidden="true"
              >
                <GripIcon className="h-4 w-4" />
              </span>

              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
                <img
                  src={product.image_url}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                  <ShoppingBagIcon className="h-4 w-4" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  {product.is_featured && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      <StarIcon className="h-2.5 w-2.5" />
                      Featured
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-zinc-500">
                  {priceLabel ?? "No price set"}
                </p>
              </div>

              <StatusBadge status={product.is_active ? "active" : "inactive"} />

              <div className="flex shrink-0 items-center gap-1">
                <form
                  action={() => handleToggleActive(product.id, product.name, !product.is_active)}
                >
                  <ToggleSwitchButton isActive={product.is_active} />
                </form>

                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  title="Edit product"
                  aria-label={`Edit ${product.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>

                <ConfirmAction
                  action={() => handleDelete(product.id, product.name)}
                  title="Delete this product?"
                  description={`"${product.name}" will be removed from your profile.`}
                  confirmLabel="Delete"
                  trigger={
                    <button
                      type="button"
                      title="Delete product"
                      aria-label={`Delete ${product.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/15"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  }
                />

                <RowMenu
                  items={[
                    {
                      label: product.is_featured ? "Unfeature" : "Feature",
                      onSelect: () =>
                        handleToggleFeatured(product.id, product.name, !product.is_featured),
                    },
                    { label: "Move up", onSelect: () => handleMove(product.id, "up") },
                    { label: "Move down", onSelect: () => handleMove(product.id, "down") },
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
      aria-label={isActive ? "Hide this product" : "Show this product"}
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
