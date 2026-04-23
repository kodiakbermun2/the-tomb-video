import type { Metadata } from "next";
import { CatalogShell } from "@/components/catalog-shell";
import { getAvailableFormats } from "@/lib/catalog";
import { getProducts } from "@/lib/shopify";
import { Product } from "@/lib/shopify/types";

export const revalidate = 120;
export const metadata: Metadata = {
  title: "Bargain Bin",
  alternates: {
    canonical: "/bargain-bin",
  },
};

type BargainBinPageProps = {
  searchParams: Promise<{
    q?: string;
    format?: string;
  }>;
};

function getPrice(product: Product) {
  const variant = product.variants.nodes[0];
  const money = variant?.price ?? product.priceRange.minVariantPrice;
  return Number(money.amount);
}

export default async function BargainBinPage({ searchParams }: BargainBinPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q ?? "";
  const format = resolvedSearchParams.format ?? "";

  const products = await getProducts(250);
  const bargainProducts = products.filter((product) => getPrice(product) <= 5);
  const formats = getAvailableFormats(bargainProducts);

  return (
    <section className="pb-8">
      <header className="noise-panel rounded-lg p-5 sm:p-7">
        <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Budget picks</p>
        <h1 className="tomb-title mt-2 text-5xl leading-[0.9] sm:text-6xl">BARGAIN BIN</h1>
        <p className="tomb-subtle mt-3 max-w-2xl text-sm sm:text-base">
          Every title in this section is priced at $5.00 or less.
        </p>
      </header>

      <CatalogShell
        products={bargainProducts}
        formats={formats}
        initialQuery={query}
        initialFormat={format}
        sectionId="bargain-bin-catalog"
        sectionTitle="Bargain Bin"
      />
    </section>
  );
}
