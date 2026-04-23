"use client";

import { useMemo, useState } from "react";
import { getSortableTitle } from "@/lib/catalog";
import { Product } from "@/lib/shopify/types";
import { ProductGrid } from "./product-grid";

type SortMode = "newest" | "oldest" | "az" | "za" | "priceAsc" | "priceDesc";

type ProductSortPanelProps = {
  products: Product[];
  emptyMessage?: string;
};

export function ProductSortPanel({ products, emptyMessage }: ProductSortPanelProps) {
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const sortedProducts = useMemo(() => {
    const next = [...products];

    const getPrice = (product: Product) => {
      const variant = product.variants.nodes[0];
      return Number((variant?.price ?? product.priceRange.minVariantPrice).amount);
    };

    if (sortMode === "oldest") {
      next.reverse();
    } else if (sortMode === "az") {
      next.sort((a, b) =>
        getSortableTitle(a.title).localeCompare(getSortableTitle(b.title), undefined, {
          sensitivity: "base",
        }),
      );
    } else if (sortMode === "za") {
      next.sort((a, b) =>
        getSortableTitle(b.title).localeCompare(getSortableTitle(a.title), undefined, {
          sensitivity: "base",
        }),
      );
    } else if (sortMode === "priceAsc") {
      next.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortMode === "priceDesc") {
      next.sort((a, b) => getPrice(b) - getPrice(a));
    }

    return next;
  }, [products, sortMode]);

  const chronoActive = sortMode === "newest" || sortMode === "oldest";
  const alphaActive = sortMode === "az" || sortMode === "za";
  const priceActive = sortMode === "priceAsc" || sortMode === "priceDesc";
  const chronoLabel = sortMode === "oldest" ? "oldest" : "newest";
  const alphaLabel = sortMode === "za" ? "z-a" : "a-z";
  const priceLabel = sortMode === "priceDesc" ? "$$$ -> $" : "$ -> $$$";

  const handleChronoToggle = () => {
    if (sortMode === "newest") {
      setSortMode("oldest");
      return;
    }
    if (sortMode === "oldest") {
      setSortMode("newest");
      return;
    }
    setSortMode("newest");
  };

  const handleAlphaToggle = () => {
    if (sortMode === "az") {
      setSortMode("za");
      return;
    }
    if (sortMode === "za") {
      setSortMode("az");
      return;
    }
    setSortMode("az");
  };

  const handlePriceToggle = () => {
    if (sortMode === "priceAsc") {
      setSortMode("priceDesc");
      return;
    }
    if (sortMode === "priceDesc") {
      setSortMode("priceAsc");
      return;
    }
    setSortMode("priceAsc");
  };

  return (
    <>
      <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
        <div className="flex items-start gap-2">
          <span className="mt-1 text-zinc-500">Sort:</span>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={handleChronoToggle}
              className={`rounded-full border px-2.5 py-1 font-bold transition-colors ${
                chronoActive
                  ? "border-lime-300/80 bg-lime-300 text-black"
                  : "border-white/35 bg-white text-black"
              }`}
            >
              {chronoLabel}
            </button>
            <button
              type="button"
              onClick={handleAlphaToggle}
              className={`rounded-full border px-2.5 py-1 font-bold transition-colors ${
                alphaActive
                  ? "border-lime-300/80 bg-lime-300 text-black"
                  : "border-white/35 bg-white text-black"
              }`}
            >
              {alphaLabel}
            </button>
            <button
              type="button"
              onClick={handlePriceToggle}
              className={`rounded-full border px-2.5 py-1 font-bold transition-colors ${
                priceActive
                  ? "border-lime-300/80 bg-lime-300 text-black"
                  : "border-white/35 bg-white text-black"
              }`}
            >
              {priceLabel}
            </button>
          </div>
        </div>
      </div>

      <ProductGrid products={sortedProducts} emptyMessage={emptyMessage} />
    </>
  );
}
