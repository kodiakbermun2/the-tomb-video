import { Product } from "@/lib/shopify/types";
import { ProductCard } from "./product-card";

type ProductGridProps = {
  products: Product[];
  emptyMessage?: string;
  dense?: boolean;
  className?: string;
  columnsClassName?: string;
  rareBadgeVariant?: "catalog" | "arrivals";
  eagerImageCount?: number;
};

export function ProductGrid({
  products,
  emptyMessage,
  dense = false,
  className,
  columnsClassName,
  rareBadgeVariant = "catalog",
  eagerImageCount = 0,
}: ProductGridProps) {
  const sectionClassName = className ?? "mt-8";
  const resolvedColumnsClassName =
    columnsClassName ??
    (dense
      ? "grid-cols-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6"
      : "grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5");

  if (products.length === 0) {
    return (
      <section aria-label="Product grid" className={sectionClassName}>
        <div className="rounded-xl border border-white/15 bg-black/45 p-6 text-sm text-zinc-300 sm:p-8">
          <p>
            {emptyMessage || "No products are showing yet. This shelf is empty."}
          </p>
          <p className="mt-2 text-zinc-400">
            Add your images in Shopify: Products - pick a product - Media - Add media.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Product grid" className={sectionClassName}>
      <div className={`grid gap-3 ${resolvedColumnsClassName}`}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            dense={dense}
            rareBadgeVariant={rareBadgeVariant}
            eagerImage={index < eagerImageCount}
          />
        ))}
      </div>
    </section>
  );
}
