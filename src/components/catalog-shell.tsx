"use client";

import { useMemo, useState } from "react";
import { filterProducts } from "@/lib/catalog";
import { Product } from "@/lib/shopify/types";
import { CatalogControls } from "./catalog-controls";
import { ProductGrid } from "./product-grid";

type SortMode = "newest" | "oldest" | "az" | "za" | "priceAsc" | "priceDesc";

type CatalogShellProps = {
  products: Product[];
  formats: string[];
  initialQuery: string;
  initialFormat: string;
  initialViewMode: "grid" | "dense";
};

export function CatalogShell({
  products,
  formats,
  initialQuery,
  initialFormat,
  initialViewMode,
}: CatalogShellProps) {
  const [searchDraft, setSearchDraft] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeFormat, setActiveFormat] = useState(initialFormat);
  const [activeViewMode, setActiveViewMode] = useState<"grid" | "dense">(initialViewMode);
  const [sortMode, setSortMode] = useState<SortMode>("az");

  const filteredProducts = useMemo(() => {
    const next = filterProducts(products, activeQuery, activeFormat);
    const getPrice = (product: Product) => {
      const variant = product.variants.nodes[0];
      return Number((variant?.price ?? product.priceRange.minVariantPrice).amount);
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

    return next;
  }, [products, activeQuery, activeFormat, sortMode]);

  const firstShelfProducts = filteredProducts.slice(0, 4);
  const continuedShelfProducts = filteredProducts.slice(4);

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
    <section id="catalog" className="mt-6 scroll-mt-32">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-100">Full Catalog</h2>
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          {filteredProducts.length} titles found
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <aside className="lg:w-[280px] lg:shrink-0">
          <CatalogControls
            query={searchDraft}
            selectedFormat={activeFormat}
            formats={formats}
            viewMode={activeViewMode}
            sortMode={sortMode}
            className="sticky top-[110px] z-20 lg:h-[351px]"
            onQueryChange={setSearchDraft}
            onSearch={() => setActiveQuery(searchDraft)}
            onSelectFormat={setActiveFormat}
            onSelectView={setActiveViewMode}
            onToggleChrono={handleChronoToggle}
            onToggleAlpha={handleAlphaToggle}
            onTogglePriceSort={handlePriceToggle}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <ProductGrid
            products={firstShelfProducts}
            dense={activeViewMode === "dense"}
            emptyMessage="No matching titles found for your current search/filter combination."
            className="mt-0"
            eagerImageCount={1}
          />
        </div>
      </div>

      {continuedShelfProducts.length > 0 ? (
        <ProductGrid
          products={continuedShelfProducts}
          dense={activeViewMode === "dense"}
          className="mt-4"
        />
      ) : null}
    </section>
  );
}
