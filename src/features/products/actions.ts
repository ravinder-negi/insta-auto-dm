"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCIES } from "./currencies";
import type { ProductFormInitialValues } from "@/features/products/components/ProductForm";

export type ProductFormState = { error: string } | { ok: true } | undefined;

const URL_PATTERN = /^https?:\/\/\S+$/;

interface ProductFields {
  name: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  price: number | null;
  currency: string;
  is_featured: boolean;
  is_active: boolean;
}

function readProductFields(
  formData: FormData
): { ok: true; fields: ProductFields } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const productUrl = String(formData.get("product_url") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const currencyRaw = String(formData.get("currency") ?? "USD").trim().toUpperCase();

  if (!name) {
    return { ok: false, error: "Product name is required." };
  }

  if (productUrl && !URL_PATTERN.test(productUrl)) {
    return { ok: false, error: "Product URL must be a valid http:// or https:// link." };
  }

  let price: number | null = null;
  if (priceRaw) {
    price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 0) {
      return { ok: false, error: "Price must be a number of 0 or more." };
    }
    price = Math.round(price * 100) / 100;
  }

  const currency = (CURRENCIES as readonly string[]).includes(currencyRaw)
    ? currencyRaw
    : "USD";

  return {
    ok: true,
    fields: {
      name,
      description: description || null,
      image_url: imageUrl || null,
      product_url: productUrl || null,
      price,
      currency,
      is_featured: formData.get("is_featured") === "on",
      is_active: formData.get("is_active") === "on",
    },
  };
}

async function createProductCore(formData: FormData): Promise<ProductFormState> {
  const parsed = readProductFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: last } = await supabase
    .from("products")
    .select("position")
    .eq("profile_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("products").insert({
    profile_id: user.id,
    name: parsed.fields.name,
    description: parsed.fields.description,
    image_url: parsed.fields.image_url,
    product_url: parsed.fields.product_url,
    price: parsed.fields.price,
    currency: parsed.fields.currency,
    is_featured: parsed.fields.is_featured,
    is_active: parsed.fields.is_active,
    position: (last?.position ?? 0) + 1,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/products");
  return { ok: true };
}

/** Used by the "Add product" modal — reports success back so the modal can
 *  close itself instead of navigating away. */
export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  return createProductCore(formData);
}

/** Used by the standalone /dashboard/products/new page. */
export async function createProductAndRedirect(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const result = await createProductCore(formData);
  if (result && "error" in result) return result;
  redirect("/dashboard/products?created=1");
}

async function updateProductCore(id: string, formData: FormData): Promise<ProductFormState> {
  const parsed = readProductFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.fields.name,
      description: parsed.fields.description,
      image_url: parsed.fields.image_url,
      product_url: parsed.fields.product_url,
      price: parsed.fields.price,
      currency: parsed.fields.currency,
      is_featured: parsed.fields.is_featured,
      is_active: parsed.fields.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/products");
  return { ok: true };
}

/** Used by the edit modal — reports success back instead of navigating away. */
export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  return updateProductCore(id, formData);
}

/** Used by the standalone /dashboard/products/[id]/edit page. */
export async function updateProductAndRedirect(
  id: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const result = await updateProductCore(id, formData);
  if (result && "error" in result) return result;
  redirect("/dashboard/products?updated=1");
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/products");
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/products");
}

export async function toggleProductFeatured(id: string, isFeatured: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/products");
}

/** Persists a full drag-and-drop reorder: `orderedIds` is the new top-to-bottom order. */
export async function reorderProducts(orderedIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const updates = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("products")
        .update({ position: index })
        .eq("id", id)
        .eq("profile_id", user.id)
    )
  );

  const failed = updates.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePath("/dashboard/products");
}

export async function moveProduct(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("products")
    .select("id, profile_id, position")
    .eq("id", id)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "Product not found.");
  }

  let neighborQuery = supabase
    .from("products")
    .select("id, position")
    .eq("profile_id", current.profile_id);

  neighborQuery =
    direction === "up"
      ? neighborQuery.lt("position", current.position).order("position", { ascending: false })
      : neighborQuery.gt("position", current.position).order("position", { ascending: true });

  const { data: neighbor, error: neighborError } = await neighborQuery
    .limit(1)
    .maybeSingle();

  if (neighborError) throw new Error(neighborError.message);
  if (!neighbor) return;

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase.from("products").update({ position: neighbor.position }).eq("id", current.id),
    supabase.from("products").update({ position: current.position }).eq("id", neighbor.id),
  ]);

  if (errorA || errorB) {
    throw new Error(errorA?.message ?? errorB?.message ?? "Failed to reorder.");
  }

  revalidatePath("/dashboard/products");
}

export interface ProductFormData {
  userId: string;
  initialValues?: ProductFormInitialValues;
}

/** Fetches the product's own data when editing — the modal isn't backed by a
 *  server-rendered page, so it fetches on mount instead. */
export async function getProductFormData(
  id?: string
): Promise<ProductFormData | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!id) {
    return { userId: user.id };
  }

  const { data: product } = await supabase
    .from("products")
    .select("name, description, image_url, product_url, price, currency, is_featured, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return { error: "Product not found." };
  }

  return {
    userId: user.id,
    initialValues: {
      name: product.name,
      description: product.description,
      image_url: product.image_url,
      product_url: product.product_url,
      price: product.price,
      currency: product.currency,
      is_featured: product.is_featured,
      is_active: product.is_active,
    },
  };
}
