"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { CameraIcon, TrashIcon } from "@/components/icons";
import { CURRENCIES } from "@/features/products/currencies";
import type { ProductFormState } from "@/features/products/actions";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const fieldWrapClass =
  "flex items-center gap-2 rounded-[14px] border-[1.5px] border-[var(--line)] bg-[var(--bg)] px-3.5 transition-colors focus-within:border-[var(--primary)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[var(--primary)]/15";
const fieldInputClass = "min-h-[50px] w-full border-0 bg-transparent outline-none";

export interface ProductFormInitialValues {
  name: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  price: number | null;
  currency: string;
  is_featured: boolean;
  is_active: boolean;
}

export function ProductForm({
  action,
  initialValues,
  submitLabel,
  userId,
  onCancel,
  onSuccess,
}: {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initialValues?: ProductFormInitialValues;
  submitLabel: string;
  userId: string;
  /** Renders Cancel as a button instead of a link to "/dashboard/products" —
   *  used when the form runs inside a modal. */
  onCancel?: () => void;
  /** Called when `action` reports success without redirecting — used inside
   *  a modal, which closes itself instead of navigating away. */
  onSuccess?: () => void;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    undefined
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const [imageUrl, setImageUrl] = useState(initialValues?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(initialValues?.is_featured ?? false);
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > IMAGE_MAX_BYTES) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/product-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });

      if (error) {
        toast.error(error.message);
        return;
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4.5">
      {state && "error" in state && (
        <p
          role="alert"
          className="rounded-2xl border-[1.5px] border-[var(--danger-border)] bg-[var(--danger-tint-faint)] px-3.5 py-2.5 text-sm font-semibold text-[var(--danger-deep)]"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <span className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,var(--violet)_0%,var(--primary)_100%)] text-white/90">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
            <img src={imageUrl} alt="Product image" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <CameraIcon className="h-8 w-8" />
          )}
        </span>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={fileInputId}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-[var(--line)] bg-white px-4.5 font-semibold"
            >
              <CameraIcon className="h-4 w-4" />
              {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                aria-label="Remove image"
                className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[var(--danger-border)] text-[var(--danger-strong)] transition-colors hover:bg-[var(--danger-tint)]"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="m-0 text-xs text-[var(--muted)]">JPG or PNG, up to 5MB.</p>
        </div>
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleImageChange}
          disabled={uploading}
        />
        <input type="hidden" name="image_url" value={imageUrl} />
      </div>

      <Field label="Product name" htmlFor="name">
        <div className={fieldWrapClass}>
          <input
            id="name"
            name="name"
            required
            defaultValue={initialValues?.name}
            placeholder="e.g. Instagram Growth Guide"
            maxLength={80}
            className={fieldInputClass}
          />
        </div>
      </Field>

      <Field label="Description (optional)" htmlFor="description">
        <div className={fieldWrapClass}>
          <textarea
            id="description"
            name="description"
            defaultValue={initialValues?.description ?? ""}
            placeholder="A short description of what this product offers."
            maxLength={280}
            rows={3}
            className={`${fieldInputClass} resize-none py-3`}
          />
        </div>
      </Field>

      <Field label="Product URL (optional)" htmlFor="product_url">
        <div className={fieldWrapClass}>
          <input
            id="product_url"
            name="product_url"
            type="url"
            defaultValue={initialValues?.product_url ?? ""}
            placeholder="https://example.com/product"
            className={fieldInputClass}
          />
        </div>
        <p className="mt-1.5 text-xs text-[var(--muted)]">
          Where visitors can learn more or purchase this product. Opens in a new tab.
        </p>
      </Field>

      <div className="flex flex-wrap gap-4">
        <Field label="Price (optional)" htmlFor="price" className="flex-1 basis-[150px]">
          <div className={fieldWrapClass}>
            <input
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              defaultValue={initialValues?.price ?? ""}
              placeholder="9.00"
              className={fieldInputClass}
            />
          </div>
        </Field>

        <Field label="Currency" htmlFor="currency" className="flex-[2] basis-[150px]">
          <div className={fieldWrapClass}>
            <select
              id="currency"
              name="currency"
              defaultValue={initialValues?.currency ?? "USD"}
              className={`${fieldInputClass} appearance-none`}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-semibold">Status</span>
          <div role="group" aria-label="Status" className="flex gap-2">
            <StatusSegment label="Active" selected={isActive} onClick={() => setIsActive(true)} />
            <StatusSegment label="Hidden" selected={!isActive} onClick={() => setIsActive(false)} />
          </div>
          <input type="hidden" name="is_active" value={isActive ? "on" : ""} />
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isFeatured}
          onClick={() => setIsFeatured((value) => !value)}
          className="inline-flex min-h-[48px] cursor-pointer items-center gap-3 rounded-full border-[1.5px] border-[var(--line)] bg-white py-0 pr-4 pl-2 font-semibold"
        >
          <span
            className="inline-block h-[30px] w-12 shrink-0 rounded-full p-[3px] transition-colors"
            style={{ background: isFeatured ? "var(--success)" : "var(--line)" }}
          >
            <span
              className="block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.25)] transition-transform"
              style={{ transform: isFeatured ? "translateX(18px)" : "translateX(0)" }}
            />
          </span>
          Featured
        </button>
        <input type="hidden" name="is_featured" value={isFeatured ? "on" : ""} />
      </div>

      <div className="mt-1 flex flex-wrap gap-2.5">
        <button
          type="submit"
          disabled={pending || uploading}
          className="min-h-[54px] flex-1 basis-[200px] cursor-pointer rounded-full border-0 bg-[var(--primary)] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[54px] cursor-pointer rounded-full border-[1.5px] border-[var(--line)] bg-white px-6 font-semibold"
          >
            Cancel
          </button>
        ) : (
          <Link
            href="/dashboard/products"
            className="inline-flex min-h-[54px] items-center rounded-full border-[1.5px] border-[var(--line)] bg-white px-6 font-semibold"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}

function StatusSegment({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-[44px] cursor-pointer rounded-full border-[1.5px] px-4.5 font-bold transition-colors ${
        selected
          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink)]"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={`flex flex-col gap-2 ${className}`}>
      <span className="font-semibold">{label}</span>
      {children}
    </label>
  );
}
