"use client";

import { FormEvent } from "react";

type SortMode = "newest" | "oldest" | "az" | "za" | "priceAsc" | "priceDesc";

type CatalogControlsProps = {
  query: string;
  selectedFormat: string;
  formats: string[];
  sortMode: SortMode;
  className?: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onSelectFormat: (format: string) => void;
  onToggleChrono: () => void;
  onToggleAlpha: () => void;
  onTogglePriceSort: () => void;
};

export function CatalogControls({
  query,
  selectedFormat,
  formats,
  sortMode,
  className,
  onQueryChange,
  onSearch,
  onSelectFormat,
  onToggleChrono,
  onToggleAlpha,
  onTogglePriceSort,
}: CatalogControlsProps) {
  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  const chronoActive = sortMode === "newest" || sortMode === "oldest";
  const alphaActive = sortMode === "az" || sortMode === "za";
  const priceActive = sortMode === "priceAsc" || sortMode === "priceDesc";
  const chronoLabel = sortMode === "oldest" ? "oldest" : "newest";
  const alphaLabel = sortMode === "za" ? "z-a" : "a-z";
  const priceLabel = sortMode === "priceDesc" ? "$$$ -> $" : "$ -> $$$";

  return (
    <section className={`noise-panel flex h-full flex-col rounded-xl p-4 sm:p-5 ${className || ""}`}>
      <form className="grid gap-4" onSubmit={onSearchSubmit}>
        <div className="grid gap-1.5">
          <label htmlFor="q" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
            Search products
          </label>
          <div className="flex items-center gap-2">
            <input
              id="q"
              name="q"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search..."
              className="h-11 w-full min-w-0 rounded-md border border-white/25 bg-black/60 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-400 focus:border-lime-300/70"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-lime-300/70 bg-lime-300/15 text-lime-200 transition hover:bg-lime-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
            Filter format
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectFormat("")}
              className={`vhs-sticker-btn text-[10px] ${
                !selectedFormat ? "vhs-sticker-acid" : "vhs-sticker-cream"
              }`}
            >
              All formats
            </button>
            {formats.map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => onSelectFormat(format)}
                className={`vhs-sticker-btn text-[10px] ${
                  selectedFormat.toLowerCase() === format.toLowerCase()
                    ? "vhs-sticker-acid"
                    : "vhs-sticker-cream"
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
        <div className="flex items-start gap-2">
          <span className="mt-1 text-zinc-500">Sort:</span>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={onToggleChrono}
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
              onClick={onToggleAlpha}
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
              onClick={onTogglePriceSort}
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
    </section>
  );
}
