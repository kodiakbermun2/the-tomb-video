"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { formatMoney } from "@/lib/format";
import { type ProductStickerKind, resolveProductStickerSlots } from "@/lib/product-stickers";
import { getOwnershipBadge, isRareItem, isStaffPickItem } from "@/lib/product-metadata";
import { getShopifyImageUrl } from "@/lib/shopify/image";
import { Product } from "@/lib/shopify/types";
import {
  getThumbnailStyle,
  type ThumbnailOverrideMap,
} from "@/lib/thumbnail-overrides";

type RecentlyViewedCarouselProps = {
  currentHandle: string;
  products: Product[];
  thumbnailOverrides?: ThumbnailOverrideMap;
};

const STORAGE_KEY = "tomb-video-recently-viewed";
const MAX_RECENT = 8;
const STORAGE_EVENT = "tomb-video-recently-viewed-updated";
const EMPTY_SNAPSHOT = "[]";

function readStoredHandlesSnapshot() {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function buildRecentHandles(storedHandles: string[], currentHandle: string) {
  const normalizedCurrent = currentHandle.trim().toLowerCase();
  return storedHandles
    .filter((entry) => entry.toLowerCase() !== normalizedCurrent)
    .slice(0, MAX_RECENT);
}

export function RecentlyViewedCarousel({
  currentHandle,
  products,
  thumbnailOverrides,
}: RecentlyViewedCarouselProps) {
  const renderSticker = (sticker: ProductStickerKind | null, corner: "left" | "right") => {
    if (!sticker) {
      return null;
    }

    const commonClass =
      "pointer-events-none vhs-sticker-btn absolute z-10 h-14 w-14 p-0 !text-black";
    const cornerClass = corner === "right" ? "rotate-[10deg]" : "-rotate-[10deg]";
    const cornerStyle =
      corner === "right"
        ? { position: "absolute" as const, right: "-0.55rem", top: "-0.65rem" }
        : { position: "absolute" as const, left: "-0.55rem", top: "-0.65rem" };

    if (sticker === "new") {
      return (
        <span
          className={`${commonClass} vhs-sticker-acid ${cornerClass} text-[12px] uppercase tracking-[0.12em]`}
          style={cornerStyle}
        >
          New!
        </span>
      );
    }

    if (sticker === "rare") {
      return (
        <span
          className={`${commonClass} vhs-sticker-pink ${cornerClass} text-[12px] uppercase tracking-[0.12em]`}
          style={cornerStyle}
        >
          Rare!
        </span>
      );
    }

    return (
      <span
        className={`${commonClass} vhs-sticker-orange ${cornerClass} text-center text-[10px] uppercase leading-[0.88] tracking-[0.04em]`}
        style={cornerStyle}
      >
        Staff
        <br />
        Pick
      </span>
    );
  };

  const storedHandlesSnapshot = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const handleStorageEvent = () => {
        onStoreChange();
      };

      window.addEventListener("storage", handleStorageEvent);
      window.addEventListener(STORAGE_EVENT, handleStorageEvent);

      return () => {
        window.removeEventListener("storage", handleStorageEvent);
        window.removeEventListener(STORAGE_EVENT, handleStorageEvent);
      };
    },
    readStoredHandlesSnapshot,
    () => EMPTY_SNAPSHOT,
  );

  const storedHandles = useMemo(() => {
    try {
      const values = JSON.parse(storedHandlesSnapshot);
      return Array.isArray(values) ? values.filter((entry) => typeof entry === "string") : [];
    } catch {
      return [];
    }
  }, [storedHandlesSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const normalizedCurrent = currentHandle.trim().toLowerCase();
    const stored = (() => {
      try {
        const values = JSON.parse(readStoredHandlesSnapshot());
        return Array.isArray(values) ? values.filter((entry) => typeof entry === "string") : [];
      } catch {
        return [];
      }
    })();
    const next = [
      normalizedCurrent,
      ...stored.filter((entry) => entry.toLowerCase() !== normalizedCurrent),
    ].slice(0, 24);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, [currentHandle]);

  const recentHandles = useMemo(
    () => buildRecentHandles(storedHandles, currentHandle),
    [storedHandles, currentHandle],
  );

  const items = useMemo(() => {
    const byHandle = new Map(products.map((product) => [product.handle.toLowerCase(), product]));

    return recentHandles
      .map((handle) => byHandle.get(handle.toLowerCase()))
      .filter((product): product is Product => Boolean(product))
      .slice(0, MAX_RECENT);
  }, [products, recentHandles]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-xl border border-white/15 bg-black/60 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.22em] text-zinc-300">Recently Viewed</h2>
        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Up to 8 titles</p>
      </div>

      <div className="-mx-1 flex snap-x gap-2.5 overflow-x-auto px-3 pb-2 pt-6">
        {items.map((product) => {
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
              className="group relative w-[150px] shrink-0 snap-start overflow-visible rounded-lg border border-white/15 bg-black/45 p-2 transition hover:border-lime-300/60"
            >
              {renderSticker(leftSticker, "left")}
              {renderSticker(rightSticker, "right")}

              <div className="relative mb-2 aspect-[4/5] overflow-hidden rounded bg-zinc-900">
                {image ? (
                  <Image
                    src={getShopifyImageUrl(image.url, 320)}
                    alt={image.altText ?? product.title}
                    fill
                    sizes="150px"
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

              <h3 className="line-clamp-3 text-xs font-semibold text-zinc-100">{product.title}</h3>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xs font-semibold text-lime-300">
                  {formatMoney(price.amount, price.currencyCode)}
                </span>
                {showCompareAt && compareAt ? (
                  <span className="text-[10px] text-zinc-500 line-through">
                    {formatMoney(compareAt.amount, compareAt.currencyCode)}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
