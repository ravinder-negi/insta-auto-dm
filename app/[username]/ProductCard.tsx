import { ShoppingBagIcon, StarIcon } from "../dashboard/components/icons";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  brandColor,
  buttonRadiusClass,
}: {
  product: Pick<
    Product,
    "name" | "description" | "image_url" | "product_url" | "price" | "currency" | "is_featured"
  >;
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
    <div
      className={`overflow-hidden bg-white shadow-[0_4px_20px_-8px_rgba(24,24,60,0.18)] dark:bg-white/5 ${buttonRadiusClass}`}
      style={
        product.is_featured
          ? {
              borderLeft: `4px solid ${brandColor}`,
              backgroundImage: `linear-gradient(90deg, ${brandColor}0f, transparent 55%)`,
            }
          : undefined
      }
    >
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-uploaded URL
        <img
          src={product.image_url}
          alt=""
          className="h-64 w-full object-cover"
        />
      ) : (
        <div
          className="flex h-64 w-full items-center justify-center"
          style={{ backgroundColor: `${brandColor}14`, color: brandColor }}
        >
          <ShoppingBagIcon className="h-12 w-12" />
        </div>
      )}

      <div className="flex flex-col gap-2 p-5 text-left">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">{product.name}</p>
          {product.is_featured && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              <StarIcon className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>

        {product.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {product.description}
          </p>
        )}

        {priceLabel && (
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{priceLabel}</p>
        )}

        {product.product_url && (
          <a
            href={product.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99] ${buttonRadiusClass}`}
            style={{ backgroundColor: brandColor }}
          >
            View Product
          </a>
        )}
      </div>
    </div>
  );
}
