import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { PlusIcon, ShoppingBagIcon } from "../components/icons";
import { primaryButtonClass } from "../components/styles";
import { ProductsList } from "./ProductsList";
import type { Product } from "@/lib/types";

export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("profile_id", user.id)
    .order("position", { ascending: true })
    .returns<Product[]>();

  const products = data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Link-in-bio"
        title="Products"
        description="Manage the products you want to showcase on your public profile."
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<ShoppingBagIcon className="h-6 w-6" />}
          title="No products yet"
          description="Showcase products, resources, or offers on your public profile."
          action={
            <Link href="/dashboard/products/new" className={primaryButtonClass}>
              <PlusIcon className="h-4 w-4" />
              Add product
            </Link>
          }
        />
      ) : (
        <ProductsList products={products} />
      )}
    </div>
  );
}
