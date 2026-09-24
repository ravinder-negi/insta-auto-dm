"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fieldClass, SelectField } from "../components/controls";
import { primaryButtonClass, secondaryButtonClass } from "../components/styles";
import { useToast } from "../components/Toast";
import { CameraIcon, TrashIcon } from "../components/icons";
import { CURRENCIES } from "./currencies";
import type { ProductFormState } from "./actions";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

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
}: {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initialValues?: ProductFormInitialValues;
  submitLabel: string;
  userId: string;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    undefined
  );

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
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl border border-black/6 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] sm:p-5 dark:border-white/8 dark:bg-white/4"
    >
      <div>
        <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Product image
        </span>
        <div className="flex items-center gap-4">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
            <img
              src={imageUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-xl border border-black/8 object-cover dark:border-white/10"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-black/15 text-zinc-300 dark:border-white/15 dark:text-zinc-600">
              <CameraIcon className="h-6 w-6" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor={fileInputId}
                className={`${secondaryButtonClass} cursor-pointer`}
              >
                {uploading ? "Uploading..." : imageUrl ? "Replace" : "Upload image"}
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  aria-label="Remove image"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/15"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500">Square image recommended, up to 5MB.</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          disabled={uploading}
        />
        <input type="hidden" name="image_url" value={imageUrl} />
      </div>

      <Field label="Product name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          defaultValue={initialValues?.name}
          placeholder="e.g. Instagram Growth Guide"
          maxLength={80}
          className={fieldClass}
        />
      </Field>

      <Field label="Description (optional)" htmlFor="description">
        <textarea
          id="description"
          name="description"
          defaultValue={initialValues?.description ?? ""}
          placeholder="A short description of what this product offers."
          maxLength={280}
          rows={3}
          className={`${fieldClass} resize-none`}
        />
      </Field>

      <Field label="Product URL (optional)" htmlFor="product_url">
        <input
          id="product_url"
          name="product_url"
          type="url"
          defaultValue={initialValues?.product_url ?? ""}
          placeholder="https://example.com/product"
          className={fieldClass}
        />
        <p className="mt-1.5 text-xs text-zinc-500">
          Where visitors can learn more or purchase this product. Opens in a new tab.
        </p>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (optional)" htmlFor="price">
          <input
            id="price"
            name="price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue={initialValues?.price ?? ""}
            placeholder="9.00"
            className={fieldClass}
          />
        </Field>

        <Field label="Currency" htmlFor="currency">
          <SelectField id="currency" name="currency" defaultValue={initialValues?.currency ?? "USD"}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </SelectField>
        </Field>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-black/8 px-3.5 py-3 dark:border-white/10">
        <div>
          <p className="text-sm font-medium">Feature this product</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Featured products are visually highlighted on your public profile.
          </p>
        </div>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            name="is_featured"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-brand-600 dark:bg-zinc-700" />
          <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-black/8 px-3.5 py-3 dark:border-white/10">
        <div>
          <p className="text-sm font-medium">Show on profile</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Make this product visible to visitors on your public profile.
          </p>
        </div>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            name="is_active"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors peer-checked:bg-brand-600 dark:bg-zinc-700" />
          <div className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {state?.error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5">
        <Link href="/dashboard/products" className={secondaryButtonClass}>
          Cancel
        </Link>
        <button type="submit" disabled={pending || uploading} className={primaryButtonClass}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}
