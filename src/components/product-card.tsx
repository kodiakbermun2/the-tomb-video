import Image from "next/image";
import Link from "next/link";
import { getProductFormats } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { getMediaChipClass } from "@/lib/media-chip";
import { type ProductStickerKind, resolveProductStickerSlots } from "@/lib/product-stickers";
import { getOwnershipBadge, isRareItem, isStaffPickItem } from "@/lib/product-metadata";
import { getShopifyImageUrl } from "@/lib/shopify/image";
import { Product } from "@/lib/shopify/types";
import { getThumbnailStyle, type ThumbnailOverride } from "@/lib/thumbnail-overrides";

type ProductCardProps = {
  product: Product;
  dense?: boolean;
  rareBadgeVariant?: "catalog" | "arrivals";
  stickerLayout?: "default" | "stackRight";
  eagerImage?: boolean;
  thumbnailOverride?: ThumbnailOverride | null;
};

export function ProductCard({
  product,
  dense = false,
  rareBadgeVariant = "catalog",
  stickerLayout = "default",
  eagerImage = false,
  thumbnailOverride = null,
}: ProductCardProps) {
  const image = product.featuredImage ?? product.images.nodes[0] ?? null;
  const variant = product.variants.nodes[0];
  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = variant?.compareAtPrice;
  const showCompareAt = Boolean(compareAt) && Number(compareAt?.amount || 0) > Number(price.amount);
  const imageUrl = image ? getShopifyImageUrl(image.url, 640) : null;
  const formats = getProductFormats(product).slice(0, 2);
  const ownershipBadge = getOwnershipBadge(product);
  const isRare = isRareItem(product);
  const isStaffPick = isStaffPickItem(product);
  const available = product.availableForSale ?? product.variants.nodes.some((entry) => entry.availableForSale);
  const ownershipChipClass =
    ownershipBadge === "NEW"
      ? "border-lime-300/90 bg-[#c9ff37] !text-black"
      : "border-zinc-400/70 bg-zinc-500/30 text-zinc-100";
  const rareBadgeClass =
    rareBadgeVariant === "arrivals"
      ? "h-20 w-20 text-[15px]"
      : "h-14 w-14 text-[12px]";
  const rareBadgePosition =
    rareBadgeVariant === "arrivals"
      ? { right: "-0.75rem", top: "-1rem" }
      : { right: "-0.55rem", top: "-0.65rem" };
  const { rightSticker, leftSticker } = resolveProductStickerSlots({
    isRare,
    isStaffPick,
    ownershipBadge,
  });
  const stackedRightStickers: ProductStickerKind[] = [
    ...(ownershipBadge === "NEW" ? ["new" as const] : []),
    ...(isRare ? ["rare" as const] : []),
    ...(isStaffPick ? ["staffPick" as const] : []),
  ];
  const thumbnailStyle = getThumbnailStyle(thumbnailOverride);
  const shouldApplyZoom = Math.abs(thumbnailStyle.zoom - 1) > 0.001;

  const renderSticker = (sticker: ProductStickerKind | null, corner: "left" | "right") => {
    if (!sticker) {
      return null;
    }

    const commonClass =
      `pointer-events-none vhs-sticker-btn absolute z-10 p-0 !text-black ${rareBadgeClass}`;
    const cornerClass = corner === "right" ? "rotate-[10deg]" : "-rotate-[10deg]";
    const leftTopOffset =
      rareBadgeVariant === "arrivals"
        ? "calc(-1rem + 5rem)"
        : "-0.65rem";
    const cornerStyle =
      corner === "right"
        ? { position: "absolute" as const, ...rareBadgePosition }
        : {
            position: "absolute" as const,
            left:
              rareBadgeVariant === "arrivals"
                ? "-0.75rem"
                : "-0.55rem",
            top: leftTopOffset,
          };

    if (sticker === "new") {
      return (
        <span
          className={`${commonClass} vhs-sticker-acid ${cornerClass} uppercase tracking-[0.12em]`}
          style={cornerStyle}
        >
          New!
        </span>
      );
    }

    if (sticker === "rare") {
      return (
        <span
          className={`${commonClass} vhs-sticker-pink ${cornerClass} uppercase tracking-[0.12em]`}
          style={cornerStyle}
        >
          Rare!
        </span>
      );
    }

    return (
      <span
        className={`${commonClass} vhs-sticker-orange ${cornerClass} text-center uppercase leading-[0.9] tracking-[0.07em]`}
        style={cornerStyle}
      >
        Staff
        <br />
        Pick
      </span>
    );
  };

  const renderStackedRightSticker = (sticker: ProductStickerKind, index: number) => {
    const topOffset = `calc(${rareBadgePosition.top} + ${index * 3.85}rem)`;

    if (sticker === "new") {
      return (
        <span
          key={`stacked-new-${index}`}
          className={`pointer-events-none vhs-sticker-btn vhs-sticker-acid absolute z-10 rotate-[10deg] p-0 uppercase tracking-[0.12em] !text-black ${rareBadgeClass}`}
          style={{ position: "absolute", right: rareBadgePosition.right, top: topOffset }}
        >
          New!
        </span>
      );
    }

    if (sticker === "rare") {
      return (
        <span
          key={`stacked-rare-${index}`}
          className={`pointer-events-none vhs-sticker-btn vhs-sticker-pink absolute z-10 rotate-[10deg] p-0 uppercase tracking-[0.12em] !text-black ${rareBadgeClass}`}
          style={{ position: "absolute", right: rareBadgePosition.right, top: topOffset }}
        >
          Rare!
        </span>
      );
    }

    return (
      <span
        key={`stacked-staff-${index}`}
        className={`pointer-events-none vhs-sticker-btn vhs-sticker-orange absolute z-10 rotate-[10deg] p-0 text-center uppercase leading-[0.9] tracking-[0.07em] !text-black ${rareBadgeClass}`}
        style={{ position: "absolute", right: rareBadgePosition.right, top: topOffset }}
      >
        Staff
        <br />
        Pick
      </span>
    );
  };

  return (
    <Link
      href={`/products/${product.handle}`}
      className={`group relative overflow-visible rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(18,18,18,0.95),rgba(8,8,8,0.95))] transition duration-300 hover:-translate-y-0.5 hover:border-lime-300/70 hover:shadow-[0_0_0_1px_rgba(163,230,53,0.35),0_16px_30px_rgba(0,0,0,0.45)] ${
        dense ? "p-2" : "p-2.5"
      }`}
    >
      {stickerLayout === "stackRight"
        ? stackedRightStickers.map((sticker, index) => renderStackedRightSticker(sticker, index))
        : (
          <>
            {renderSticker(leftSticker, "left")}
            {renderSticker(rightSticker, "right")}
          </>
        )}
      <div className={`relative aspect-square w-full overflow-hidden rounded-md border border-white/10 bg-zinc-900 ${dense ? "mb-2" : "mb-3"}`}>
        {image ? (
          <Image
            src={imageUrl || image.url}
            alt={image.altText ?? product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
            priority={eagerImage}
            loading={eagerImage ? "eager" : "lazy"}
            fetchPriority={eagerImage ? "high" : "auto"}
            className={`object-cover transition duration-500 ${
              shouldApplyZoom ? "" : "group-hover:scale-[1.04]"
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
        ) : (
          <div className="grid h-full place-items-center text-center text-xs uppercase tracking-[0.18em] text-zinc-500">
            Product cover lands here
          </div>
        )}
      </div>

      <h3
        title={product.title}
        className={`mt-1 line-clamp-3 font-semibold leading-snug text-zinc-100 ${dense ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}
      >
        {product.title}
      </h3>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {formats.length > 0 ? (
          formats.map((format) => {
            const isDvd = format.toLowerCase().includes("dvd");

            return (
              <span
                key={format}
                className={`shop-metadata-chip ${getMediaChipClass(format)} ${isDvd ? "!text-black" : ""}`}
              >
                {format}
              </span>
            );
          })
        ) : (
          <span className="shop-metadata-chip">media</span>
        )}
        {ownershipBadge ? (
          <span
            className={`shop-metadata-chip ${ownershipChipClass}`}
            style={ownershipBadge === "NEW" ? { color: "#000" } : undefined}
          >
            {ownershipBadge}
          </span>
        ) : null}
        <span
          className={`shop-metadata-chip ${
            available
              ? ""
              : "border-red-400/70 bg-red-500/25 text-red-100"
          }`}
        >
          {available ? "in stock" : "sold out"}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-lime-300 ${dense ? "text-xs" : "text-sm"}`}>
            {formatMoney(price.amount, price.currencyCode)}
          </p>
          {showCompareAt && compareAt ? (
            <span className="text-xs text-zinc-500 line-through">
              {formatMoney(compareAt.amount, compareAt.currencyCode)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
