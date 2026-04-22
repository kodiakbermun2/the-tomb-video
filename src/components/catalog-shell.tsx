"use client";

import { useMemo, useState } from "react";
import { filterProducts, getSortableTitle } from "@/lib/catalog";
import { Product } from "@/lib/shopify/types";
import { CatalogControls } from "./catalog-controls";
import { ProductGrid } from "./product-grid";

type SortMode = "newest" | "oldest" | "az" | "za" | "priceAsc" | "priceDesc";

type CatalogShellProps = {
  products: Product[];
  formats: string[];
  initialQuery: string;
  initialFormat: string;
};

export function CatalogShell({
  products,
  formats,
  initialQuery,
  initialFormat,
}: CatalogShellProps) {
  const [searchDraft, setSearchDraft] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeFormat, setActiveFormat] = useState(initialFormat);
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
  }, [products, activeQuery, activeFormat, sortMode]);

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

      <CatalogControls
        query={searchDraft}
        selectedFormat={activeFormat}
        formats={formats}
        sortMode={sortMode}
        className="mb-4"
        onQueryChange={setSearchDraft}
        onSearch={() => setActiveQuery(searchDraft)}
        onSelectFormat={setActiveFormat}
        onToggleChrono={handleChronoToggle}
        onToggleAlpha={handleAlphaToggle}
        onTogglePriceSort={handlePriceToggle}
      />

      <ProductGrid
        products={filteredProducts}
        emptyMessage="No matching titles found for your current search/filter combination."
        className="mt-0"
        columnsClassName="grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-4"
        eagerImageCount={1}
      />
    </section>
  );
}
