import { ShoppingBagIcon, StarIcon } from "@/components/icons";
import { TrackedLink } from "./TrackedLink";
import type { Product } from "@/types";

export function ProductCard({
  product,
  profileId,
  brandColor,
  buttonRadiusClass,
}: {
  product: Pick<
    Product,
    "id" | "name" | "description" | "image_url" | "product_url" | "price" | "currency" | "is_featured"
  >;
  profileId: string;
  brandColor: string;
  buttonRadiusClass: string;
}) {
  const priceLabel =
    product.price !== null
      ? new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: product.currency,
        }).format(product.price)
      : null;

  return (
    <article
      className={`flex flex-col overflow-hidden border border-black/5 bg-white shadow-[0_18px_36px_-28px_rgba(21,19,28,0.5)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_50px_-30px_var(--brand-color)] ${buttonRadiusClass}`}
      style={
        product.is_featured
          ? {
              borderLeft: `4px solid ${brandColor}`,
              backgroundImage: `linear-gradient(90deg, ${brandColor}0f, transparent 55%)`,
            }
          : undefined
      }
    >
      <div className="relative h-52 w-full overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
          <img src={product.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: `${brandColor}14`, color: brandColor }}
          >
            <ShoppingBagIcon className="h-12 w-12" />
          </div>
        )}
        {product.is_featured && (
          <span
            className="absolute top-3.5 right-3.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: brandColor }}
          >
            <StarIcon className="h-3 w-3" />
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5 text-left">
        <p className="font-display text-lg font-extrabold tracking-tight text-[var(--ink)]">
          {product.name}
        </p>

        {product.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
          {priceLabel && (
            <span className="font-display text-xl font-extrabold tracking-tight text-[var(--ink)]">
              {priceLabel}
            </span>
          )}
        </div>

        {product.product_url && (
          <TrackedLink
            profileId={profileId}
            targetType="product"
            targetId={product.id}
            href={product.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-12 items-center justify-center px-5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] ${buttonRadiusClass}`}
            style={{ backgroundColor: brandColor }}
          >
            View product
          </TrackedLink>
        )}
      </div>
    </article>
  );
}
