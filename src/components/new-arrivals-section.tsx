"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/shopify/types";
import { ProductGrid } from "./product-grid";

type SortMode = "newest" | "oldest" | "az" | "za" | "priceAsc" | "priceDesc";

type NewArrivalsSectionProps = {
  products: Product[];
};

export function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const featured = useMemo(() => {
    const next = [...products];
    const getPrice = (product: Product) => {
      const firstVariant = product.variants.nodes[0];
      const price = firstVariant?.price ?? product.priceRange.minVariantPrice;
      return Number(price.amount);
    };

    if (sortMode === "oldest") {
      next.reverse();
    } else if (sortMode === "az") {
      next.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    } else if (sortMode === "za") {
      next.sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: "base" }));
    } else if (sortMode === "priceAsc") {
      next.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortMode === "priceDesc") {
      next.sort((a, b) => getPrice(b) - getPrice(a));
    }

    return next.slice(0, 4);
  }, [products, sortMode]);

  if (featured.length === 0) {
    return null;
  }

  const chronoActive = sortMode === "newest" || sortMode === "oldest";
  const alphaActive = sortMode === "az" || sortMode === "za";
  const priceActive = sortMode === "priceAsc" || sortMode === "priceDesc";
  const chronoLabel = sortMode === "oldest" ? "oldest" : "newest";
  const alphaLabel = sortMode === "za" ? "z-a" : "a-z";
  const priceLabel = sortMode === "priceDesc" ? "$$$ -> $" : "$ -> $$$";

  const handleChronoClick = () => {
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

  const handleAlphaClick = () => {
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

  const handlePriceClick = () => {
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
    <section className="mt-6 rounded-xl border border-white/10 bg-black/35 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm uppercase tracking-[0.22em] text-zinc-300">New arrivals</h2>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
          <button
            type="button"
            onClick={handleChronoClick}
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
            onClick={handleAlphaClick}
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
            onClick={handlePriceClick}
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
      <ProductGrid products={featured} rareBadgeVariant="arrivals" eagerImageCount={1} />
    </section>
  );
}
