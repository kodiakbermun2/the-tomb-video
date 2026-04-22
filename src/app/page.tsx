import type { Metadata } from "next";
import Link from "next/link";
import { CatalogShell } from "@/components/catalog-shell";
import { NewArrivalsSection } from "@/components/new-arrivals-section";
import { getAvailableFormats, getProductFormats } from "@/lib/catalog";
import { getProducts } from "@/lib/shopify";
import { Product } from "@/lib/shopify/types";

export const revalidate = 120;
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

type HomePageProps = {
  searchParams: Promise<{
    q?: string;
    format?: string;
    view?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q ?? "";
  const format = resolvedSearchParams.format ?? "";
  const viewMode = resolvedSearchParams.view === "dense" ? "dense" : "grid";

  let products: Product[] = [];
  let shopifyReady = true;
  let shopifyError = "";

  try {
    products = await getProducts(24);
  } catch (error) {
    shopifyReady = false;
    shopifyError = error instanceof Error ? error.message : "Unknown Shopify error.";
  }

  const formats = getAvailableFormats(products);
  const inStockFormats = Array.from(
    new Set(
      products
        .filter(
          (product) =>
            (product.availableForSale ?? false) ||
            product.variants.nodes.some((variant) => variant.availableForSale),
        )
        .flatMap((product) => getProductFormats(product)),
    ),
  ).sort();

  const formatLabelMap: Record<string, string> = {
    "4k": "4K",
    "blu-ray": "Blu-ray",
    "dvd": "DVD",
    "vhs": "VHS",
    "laserdisc": "LaserDisc",
    "vinyl": "Vinyl",
    "cassette": "Cassette",
    "book": "Book",
    "poster": "Poster",
    "apparel": "Apparel",
  };

  const formatClassMap: Record<string, string> = {
    "vhs": "vhs-sticker-acid",
    "dvd": "vhs-sticker-cream",
    "blu-ray": "border-sky-300/85 bg-sky-300 !text-black",
    "4k": "border-white/35 bg-black !text-zinc-100",
    "laserdisc": "vhs-sticker-orange",
    "vinyl": "vhs-sticker-pink",
    "cassette": "vhs-sticker-red",
    "book": "vhs-sticker-cream",
    "poster": "vhs-sticker-cream",
    "apparel": "vhs-sticker-cream",
  };

  return (
    <div className="pb-8">
      <section className="noise-panel stagger-in relative overflow-hidden rounded-xl px-4 py-8 sm:px-8 sm:py-10">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-lime-300/90">
            Independent physical media store
          </p>
          <h1 className="tomb-title messy-underline text-5xl leading-[0.9] sm:text-7xl">
            FROM OUR ATTIC TO YOUR SHELF
          </h1>
          <p className="tomb-subtle mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
            A curated collection of used and new physical media and movie memorabilia spanning horror, sci-fi, cult films, weird cinema, video store classics, and unconventional contemporary hits.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-widest text-zinc-200/90">
            {inStockFormats.map((format) => (
              <Link
                key={format}
                href={`/tags/${encodeURIComponent(format)}`}
                className={`vhs-sticker-btn px-3 py-1 text-[10px] ${formatClassMap[format] ?? "vhs-sticker-cream"}`}
              >
                {formatLabelMap[format] ?? format}
              </Link>
            ))}
          </div>
          <a
            href="#catalog"
            className="vhs-sticker-btn vhs-sticker-acid vhs-sticker-tilt-left mt-6 text-[10px]"
          >
            Browse catalog
          </a>
        </div>
      </section>

      <NewArrivalsSection products={products} />

      {!shopifyReady ? (
        <section className="mt-6 rounded-md border border-red-400/40 bg-red-950/20 px-4 py-3 text-sm text-red-100">
          Shopify data is offline. {shopifyError || "Check your Shopify setup and retry."}
        </section>
      ) : null}

      {shopifyReady && products.length === 0 ? (
        <section className="mt-6 rounded-md border border-amber-300/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          Shopify is connected, but no products are live yet. In Shopify, add a
          product with media, set status to Active, and publish it to the Online
          Store sales channel so it appears here.
        </section>
      ) : null}

      <CatalogShell
        products={products}
        formats={formats}
        initialQuery={query}
        initialFormat={format}
        initialViewMode={viewMode}
      />
    </div>
  );
}
