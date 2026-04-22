"use client";

import { useMemo, useState } from "react";
import { getSortableTitle } from "@/lib/catalog";
import { Product } from "@/lib/shopify/types";
import { ProductGrid } from "./product-grid";

type SortMode = "newest" | "oldest" | "az" | "za" | "priceAsc" | "priceDesc";

type NewArrivalsSectionProps = {
  products: Product[];
};

export function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [pageStart, setPageStart] = useState(0);
  const pageSize = 4;

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
    setPageStart(0);
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
    setPageStart(0);
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
    setPageStart(0);
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

  const maxPageStart = Math.max(0, Math.floor((featured.length - 1) / pageSize) * pageSize);
  const safePageStart = Math.min(pageStart, maxPageStart);
  const canGoPrev = safePageStart > 0;
  const canGoNext = safePageStart + pageSize < featured.length;
  const visibleProducts = featured.slice(safePageStart, safePageStart + pageSize);

  const handlePrev = () => {
    setPageStart((current) => Math.max(0, current - pageSize));
  };

  const handleNext = () => {
    setPageStart((current) => Math.min(maxPageStart, current + pageSize));
  };

  return (
    <section className="mt-6 rounded-xl border border-white/10 bg-black/35 p-4 sm:p-5">
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h2 className="text-sm uppercase tracking-[0.22em] text-zinc-300">New arrivals</h2>
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
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
      <div className="relative lg:px-10">
        <div className="mb-2 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev}
            aria-label="Show previous new arrivals"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-white font-bold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Show more new arrivals"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-white font-bold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          >
            &gt;
          </button>
        </div>
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label="Show previous new arrivals"
          className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white font-bold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-45 lg:inline-flex"
        >
          &lt;
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Show more new arrivals"
          className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white font-bold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-45 lg:inline-flex"
        >
          &gt;
        </button>
        <ProductGrid products={visibleProducts} rareBadgeVariant="arrivals" eagerImageCount={1} />
      </div>
    </section>
  );
}
