import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { getShopifyImageUrl } from "@/lib/shopify/image";
import { Product } from "@/lib/shopify/types";

type MoreLikeThisCarouselProps = {
  products: Product[];
};

export function MoreLikeThisCarousel({ products }: MoreLikeThisCarouselProps) {
  return (
    <section className="mt-8 border-t border-white/10 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.22em] text-zinc-300">More Like This</h2>
        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Related titles</p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-md border border-white/15 bg-black/35 p-4 text-sm text-zinc-400">
          Add more tagged products to populate related recommendations.
        </div>
      ) : null}

      {products.length > 0 ? (
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {products.map((product) => {
          const image = product.featuredImage ?? product.images.nodes[0] ?? null;
          const variant = product.variants.nodes[0];
          const price = variant?.price ?? product.priceRange.minVariantPrice;
          const compareAt = variant?.compareAtPrice;
          const showCompareAt =
            Boolean(compareAt) && Number(compareAt?.amount || 0) > Number(price.amount);

          return (
            <Link
              key={product.id}
              href={`/products/${product.handle}`}
              className="group w-[190px] shrink-0 snap-start overflow-hidden rounded-lg border border-white/15 bg-black/45 p-2 transition hover:border-lime-300/60"
            >
              <div className="relative mb-2 aspect-[4/5] overflow-hidden rounded bg-zinc-900">
                {image ? (
                  <Image
                    src={getShopifyImageUrl(image.url, 360)}
                    alt={image.altText ?? product.title}
                    fill
                    sizes="190px"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : null}
              </div>

              <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100">{product.title}</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-lime-300">
                  {formatMoney(price.amount, price.currencyCode)}
                </span>
                {showCompareAt && compareAt ? (
                  <span className="text-xs text-zinc-500 line-through">
                    {formatMoney(compareAt.amount, compareAt.currencyCode)}
                  </span>
                ) : null}
              </div>
            </Link>
          );
          })}
        </div>
      ) : null}
    </section>
  );
}
