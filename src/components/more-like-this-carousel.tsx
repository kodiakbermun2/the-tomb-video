import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { type ProductStickerKind, resolveProductStickerSlots } from "@/lib/product-stickers";
import { getOwnershipBadge, isRareItem, isStaffPickItem } from "@/lib/product-metadata";
import { getShopifyImageUrl } from "@/lib/shopify/image";
import { Product } from "@/lib/shopify/types";
import {
  getThumbnailStyle,
  type ThumbnailOverrideMap,
} from "@/lib/thumbnail-overrides";

type MoreLikeThisCarouselProps = {
  products: Product[];
  thumbnailOverrides?: ThumbnailOverrideMap;
};

export function MoreLikeThisCarousel({
  products,
  thumbnailOverrides,
}: MoreLikeThisCarouselProps) {
  const renderSticker = (sticker: ProductStickerKind | null, corner: "left" | "right") => {
    if (!sticker) {
      return null;
    }

    const commonClass =
      "pointer-events-none vhs-sticker-btn absolute z-10 h-20 w-20 p-0 !text-black";
    const cornerClass = corner === "right" ? "rotate-[10deg]" : "-rotate-[10deg]";
    const cornerStyle =
      corner === "right"
        ? { position: "absolute" as const, right: "-0.75rem", top: "-1rem" }
        : { position: "absolute" as const, left: "-0.75rem", top: "-1rem" };

    if (sticker === "new") {
      return (
        <span
          className={`${commonClass} vhs-sticker-acid ${cornerClass} text-[15px] uppercase tracking-[0.12em]`}
          style={cornerStyle}
        >
          New!
        </span>
      );
    }

    if (sticker === "rare") {
      return (
        <span
          className={`${commonClass} vhs-sticker-pink ${cornerClass} text-[15px] uppercase tracking-[0.12em]`}
          style={cornerStyle}
        >
          Rare!
        </span>
      );
    }

    return (
      <span
        className={`${commonClass} vhs-sticker-orange ${cornerClass} text-center text-[15px] uppercase leading-[0.9] tracking-[0.07em]`}
        style={cornerStyle}
      >
        Staff
        <br />
        Pick
      </span>
    );
  };

  return (
    <section className="mt-8 rounded-xl border border-white/15 bg-black/60 p-4 sm:p-5">
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
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-3 pb-2 pt-8">
          {products.map((product) => {
          const image = product.featuredImage ?? product.images.nodes[0] ?? null;
          const variant = product.variants.nodes[0];
          const price = variant?.price ?? product.priceRange.minVariantPrice;
          const compareAt = variant?.compareAtPrice;
          const showCompareAt =
            Boolean(compareAt) && Number(compareAt?.amount || 0) > Number(price.amount);
          const isRare = isRareItem(product);
          const isStaffPick = isStaffPickItem(product);
          const ownershipBadge = getOwnershipBadge(product);
          const { rightSticker, leftSticker } = resolveProductStickerSlots({
            isRare,
            isStaffPick,
            ownershipBadge,
          });
          const thumbnailStyle = getThumbnailStyle(
            thumbnailOverrides?.[product.handle.toLowerCase()] ?? null,
          );
          const shouldApplyZoom = Math.abs(thumbnailStyle.zoom - 1) > 0.001;

          return (
            <Link
              key={product.id}
              href={`/products/${product.handle}`}
              className="group relative w-[190px] shrink-0 snap-start overflow-visible rounded-lg border border-white/15 bg-black/45 p-2 transition hover:border-lime-300/60"
            >
              {renderSticker(leftSticker, "left")}
              {renderSticker(rightSticker, "right")}
              <div className="relative mb-2 aspect-[4/5] overflow-hidden rounded bg-zinc-900">
                {image ? (
                  <Image
                    src={getShopifyImageUrl(image.url, 360)}
                    alt={image.altText ?? product.title}
                    fill
                    sizes="190px"
                    className={`object-cover transition duration-300 ${
                      shouldApplyZoom ? "" : "group-hover:scale-[1.03]"
                    }`}
                    style={
                      shouldApplyZoom
                        ? {
                            objectPosition: thumbnailStyle.objectPosition,
                            transform: `scale(${thumbnailStyle.zoom})`,
                            transformOrigin: "center center",
                          }
                        : {
                            objectPosition: thumbnailStyle.objectPosition,
                          }
                    }
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
