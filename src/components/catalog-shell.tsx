"use client";

import { useMemo, useState } from "react";
import { filterProducts, getProductFormats, getSortableTitle } from "@/lib/catalog";
import { Product } from "@/lib/shopify/types";
import { type ThumbnailOverrideMap } from "@/lib/thumbnail-overrides";
import { CatalogControls } from "./catalog-controls";
import { ProductGrid } from "./product-grid";

const CATALOG_PAGE_SIZE = 50;

type SortMode = "newest" | "oldest" | "az" | "za" | "priceAsc" | "priceDesc";

type CatalogShellProps = {
  products: Product[];
  formats: string[];
  initialQuery: string;
  initialFormat: string;
  sectionId?: string;
  sectionTitle?: string;
  thumbnailOverrides?: ThumbnailOverrideMap;
};

export function CatalogShell({
  products,
  formats,
  initialQuery,
  initialFormat,
  sectionId = "catalog",
  sectionTitle = "Full Catalog",
  thumbnailOverrides,
}: CatalogShellProps) {
  const [searchDraft, setSearchDraft] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeFormat, setActiveFormat] = useState(initialFormat);
  const [excludedFormats, setExcludedFormats] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("az");
  const [pageStart, setPageStart] = useState(0);

  const filteredProducts = useMemo(() => {
    const next = filterProducts(products, activeQuery, activeFormat).filter((product) => {
      if (excludedFormats.length === 0) {
        return true;
      }

      const formats = getProductFormats(product).map((format) => format.toLowerCase());
      return excludedFormats.every((excluded) => !formats.includes(excluded));
    });
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
  }, [products, activeQuery, activeFormat, excludedFormats, sortMode]);

  const pagedProducts = useMemo(
    () => filteredProducts.slice(pageStart, pageStart + CATALOG_PAGE_SIZE),
    [filteredProducts, pageStart],
  );

  const canGoBack = pageStart > 0;
  const canGoForward = pageStart + CATALOG_PAGE_SIZE < filteredProducts.length;
  const maxPageStart = Math.max(0, filteredProducts.length - CATALOG_PAGE_SIZE);
  const startLabel = filteredProducts.length === 0 ? 0 : pageStart + 1;
  const endLabel = Math.min(pageStart + CATALOG_PAGE_SIZE, filteredProducts.length);

  const handleChronoToggle = () => {
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

  const handleAlphaToggle = () => {
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

  const handlePriceToggle = () => {
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

  const paginationControls = filteredProducts.length > 0 ? (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
      <span>
        Showing {startLabel}-{endLabel} of {filteredProducts.length}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPageStart((value) => Math.max(0, value - CATALOG_PAGE_SIZE))}
          disabled={!canGoBack}
          className="rounded-md border border-white/20 px-2.5 py-1.5 text-zinc-200 transition hover:border-lime-300/70 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous 50 products"
        >
          &lt; Previous 50
        </button>
        <button
          type="button"
          onClick={() =>
            setPageStart((value) => Math.min(value + CATALOG_PAGE_SIZE, maxPageStart))
          }
          disabled={!canGoForward}
          className="rounded-md border border-white/20 px-2.5 py-1.5 text-zinc-200 transition hover:border-lime-300/70 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next 50 products"
        >
          Next 50 &gt;
        </button>
      </div>
    </div>
  ) : null;

  return (
    <section id={sectionId} className="mt-6 scroll-mt-32">
      <div className="rounded-xl border border-white/15 bg-black/60 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm uppercase tracking-[0.22em] text-zinc-300">{sectionTitle}</h2>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
            {filteredProducts.length} titles found
          </p>
        </div>

      <CatalogControls
        query={searchDraft}
        selectedFormat={activeFormat}
        excludedFormats={excludedFormats}
        formats={formats}
        sortMode={sortMode}
        className="mb-4"
        onQueryChange={setSearchDraft}
        onSearch={() => {
          setPageStart(0);
          setActiveQuery(searchDraft);
        }}
        onSelectFormat={(format) => {
          const normalizedFormat = format.toLowerCase();
          setPageStart(0);

          if (!normalizedFormat) {
            setActiveFormat("");
            setExcludedFormats([]);
            return;
          }

          if (excludedFormats.includes(normalizedFormat)) {
            setExcludedFormats((current) =>
              current.filter((entry) => entry !== normalizedFormat),
            );
            setActiveFormat("");
            return;
          }

          setActiveFormat(format);
        }}
        onExcludeFormat={(format) => {
          const normalizedFormat = format.toLowerCase();
          if (!normalizedFormat) {
            return;
          }

          setPageStart(0);
          setExcludedFormats((current) =>
            current.includes(normalizedFormat)
              ? current
              : [...current, normalizedFormat],
          );

          setActiveFormat((current) =>
            current.toLowerCase() === normalizedFormat ? "" : current,
          );
        }}
        onToggleChrono={handleChronoToggle}
        onToggleAlpha={handleAlphaToggle}
        onTogglePriceSort={handlePriceToggle}
      />

      {paginationControls ? <div className="mb-4">{paginationControls}</div> : null}

      <ProductGrid
        products={pagedProducts}
        emptyMessage="No matching titles found for your current search/filter combination."
        className="mt-0"
        columnsClassName="grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-4"
        eagerImageCount={1}
        thumbnailOverrides={thumbnailOverrides}
      />

      {paginationControls ? <div className="mt-4">{paginationControls}</div> : null}
      </div>
    </section>
  );
}
