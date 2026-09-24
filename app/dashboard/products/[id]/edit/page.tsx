import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/PageHeader";
import { ProductForm } from "../../ProductForm";
import { updateProduct } from "../../actions";
import type { Product } from "@/lib/types";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, image_url, product_url, price, currency, is_featured, is_active"
    )
    .eq("id", id)
    .maybeSingle<
      Pick<
        Product,
        | "id"
        | "name"
        | "description"
        | "image_url"
        | "product_url"
        | "price"
        | "currency"
        | "is_featured"
        | "is_active"
      >
    >();

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Link
          href="/dashboard/products"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to products
        </Link>
        <PageHeader
          eyebrow="Edit product"
          title={product.name}
          description="Update this product's details."
        />
      </div>

      <ProductForm
        action={updateProduct.bind(null, id)}
        initialValues={{
          name: product.name,
          description: product.description,
          image_url: product.image_url,
          product_url: product.product_url,
          price: product.price,
          currency: product.currency,
          is_featured: product.is_featured,
          is_active: product.is_active,
        }}
        submitLabel="Save changes"
        userId={user.id}
      />
    </div>
  );
}
