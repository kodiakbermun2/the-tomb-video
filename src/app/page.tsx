import type { Metadata } from "next";
import Link from "next/link";
import { CatalogShell } from "@/components/catalog-shell";
import { NewArrivalsSection } from "@/components/new-arrivals-section";
import { getAvailableFormats, getProductFormats } from "@/lib/catalog";
import { getProducts } from "@/lib/shopify";
import { Product } from "@/lib/shopify/types";
import { getThumbnailOverridesForHandles } from "@/lib/thumbnail-overrides";

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
    arrivals?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q ?? "";
  const format = resolvedSearchParams.format ?? "";
  const arrivalsRaw = Number.parseInt(resolvedSearchParams.arrivals ?? "1", 10);

  let products: Product[] = [];
  let shopifyReady = true;
  let shopifyError = "";

  try {
    products = await getProducts();
  } catch (error) {
    shopifyReady = false;
    shopifyError = error instanceof Error ? error.message : "Unknown Shopify error.";
  }

  const formats = getAvailableFormats(products);
  const thumbnailOverrides = await getThumbnailOverridesForHandles(
    products.map((product) => product.handle),
  );
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
    "cd": "CD",
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
    "cd": "border-zinc-500/85 bg-zinc-400 !text-black",
    "4k": "border-white/35 bg-black !text-zinc-100",
    "laserdisc": "vhs-sticker-orange",
    "vinyl": "border-violet-300/85 bg-violet-200 !text-black",
    "cassette": "border-violet-400/90 bg-violet-300 !text-black",
    "book": "border-amber-300/90 bg-amber-300 !text-black",
    "poster": "vhs-sticker-cream",
    "apparel": "vhs-sticker-cream",
  };

  const ARRIVALS_SECTION_PAGE_SIZE = 12;
  const totalArrivalPages = Math.max(1, Math.ceil(products.length / ARRIVALS_SECTION_PAGE_SIZE));
  const arrivalsPage = Number.isFinite(arrivalsRaw)
    ? Math.min(Math.max(arrivalsRaw, 1), totalArrivalPages)
    : 1;
  const arrivalsStart = (arrivalsPage - 1) * ARRIVALS_SECTION_PAGE_SIZE;
  const arrivalsProducts = products.slice(arrivalsStart, arrivalsStart + ARRIVALS_SECTION_PAGE_SIZE);

  const toArrivalsHref = (page: number) => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (format) {
      params.set("format", format);
    }
    if (page > 1) {
      params.set("arrivals", String(page));
    }

    const queryString = params.toString();
    return queryString ? `/?${queryString}#new-arrivals` : "/#new-arrivals";
  };

  return (
    <div className="relative pb-8">
      <p
        className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#c9ff37] sm:mb-4 sm:text-xs"
        style={{
          WebkitTextStroke: "0.55px rgba(255,255,255,0.92)",
          textShadow:
            "-0.5px -0.5px 0 rgba(255,255,255,0.92), 0.5px -0.5px 0 rgba(255,255,255,0.92), -0.5px 0.5px 0 rgba(255,255,255,0.92), 0.5px 0.5px 0 rgba(255,255,255,0.92), 0 0 2px rgba(201,255,55,0.95), 0 0 10px rgba(201,255,55,0.68)",
        }}
      >
        Free shipping on orders over $70
      </p>
      <section className="noise-panel stagger-in relative overflow-hidden rounded-xl px-4 py-8 sm:px-8 sm:py-10">
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.28em] text-lime-300/95">
            Independent physical media store
          </p>
          <h1 className="tomb-title messy-underline text-5xl leading-[0.9] sm:text-7xl">
            FROM OUR ATTIC TO YOUR SHELF
          </h1>
          <p className="tomb-subtle mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
            A curated collection of used and new physical media and movie memorabilia spanning horror, sci-fi, cult films, weird cinema, video store classics, and unconventional contemporary hits.
          </p>
          <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-zinc-400 sm:text-[11px]">
            Browse by format
          </p>
          <div className="mt-2 flex flex-wrap gap-2.5 text-xs uppercase tracking-widest text-zinc-200/90">
            {inStockFormats.map((format) => (
              <Link
                key={format}
                href={`/tags/${encodeURIComponent(format)}`}
                className={`vhs-sticker-btn px-5 py-2 text-xs sm:text-[13px] ${formatClassMap[format] ?? "vhs-sticker-cream"}`}
              >
                {formatLabelMap[format] ?? format}
              </Link>
            ))}
          </div>
          <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-zinc-400 sm:text-[11px]">
            Or shop the full catalog
          </p>
          <a
            href="#catalog"
            className="vhs-sticker-btn vhs-sticker-acid vhs-sticker-tilt-left mt-2 px-6 py-2 text-xs sm:text-[13px]"
          >
            Browse catalog
          </a>
        </div>
      </section>

      <NewArrivalsSection
        products={arrivalsProducts}
        currentPage={arrivalsPage}
        totalPages={totalArrivalPages}
        prevPageHref={arrivalsPage > 1 ? toArrivalsHref(arrivalsPage - 1) : null}
        nextPageHref={arrivalsPage < totalArrivalPages ? toArrivalsHref(arrivalsPage + 1) : null}
        thumbnailOverrides={thumbnailOverrides}
      />

      {!shopifyReady ? (
        <section className="mt-6 rounded-md border border-red-400/40 bg-red-950/20 px-4 py-3 text-sm text-red-100">
          Shopify data is offline. {shopifyError || "Check your Shopify setup and retry."}
        </section>
      ) : null}

      {shopifyReady && products.length === 0 ? (
        <section className="mt-6 rounded-md border border-amber-300/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          Shopify is connected, but no products are live yet. In Shopify, add a
          product with media, set status to Active, and publish it to the Headless
          (and Online Store, if desired) sales channel so it appears here.
        </section>
      ) : null}

      <CatalogShell
        products={products}
        formats={formats}
        initialQuery={query}
        initialFormat={format}
        thumbnailOverrides={thumbnailOverrides}
      />
    </div>
  );
}
