import Image from "next/image";
import Link from "next/link";
import { getProductFormats } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { getMediaChipClass } from "@/lib/media-chip";
import { getOwnershipBadge, isOutOfPrint } from "@/lib/product-metadata";
import { getShopifyImageUrl } from "@/lib/shopify/image";
import { Product } from "@/lib/shopify/types";

type ProductCardProps = {
  product: Product;
  dense?: boolean;
  rareBadgeVariant?: "catalog" | "arrivals";
  eagerImage?: boolean;
};

export function ProductCard({ product, dense = false, rareBadgeVariant = "catalog", eagerImage = false }: ProductCardProps) {
  const image = product.featuredImage ?? product.images.nodes[0] ?? null;
  const variant = product.variants.nodes[0];
  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = variant?.compareAtPrice;
  const showCompareAt = Boolean(compareAt) && Number(compareAt?.amount || 0) > Number(price.amount);
  const imageUrl = image ? getShopifyImageUrl(image.url, 640) : null;
  const formats = getProductFormats(product).slice(0, 2);
  const ownershipBadge = getOwnershipBadge(product);
  const outOfPrint = isOutOfPrint(product);
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

  return (
    <Link
      href={`/products/${product.handle}`}
      className={`group relative overflow-visible rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(18,18,18,0.95),rgba(8,8,8,0.95))] transition duration-300 hover:-translate-y-0.5 hover:border-lime-300/70 hover:shadow-[0_0_0_1px_rgba(163,230,53,0.35),0_16px_30px_rgba(0,0,0,0.45)] ${
        dense ? "p-2" : "p-2.5"
      }`}
    >
      {outOfPrint ? (
        <span
          className={`pointer-events-none vhs-sticker-btn vhs-sticker-pink absolute z-10 rotate-[10deg] p-0 uppercase tracking-[0.12em] !text-black ${rareBadgeClass}`}
          style={{ position: "absolute", ...rareBadgePosition }}
        >
          Rare!
        </span>
      ) : null}
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
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
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
