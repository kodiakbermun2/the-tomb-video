import type { Metadata } from "next";
import { ProductBackButton } from "@/components/product-back-button";
import { ProductSortPanel } from "@/components/product-sort-panel";
import { hasExactTag } from "@/lib/product-metadata";
import { getProducts } from "@/lib/shopify";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  return {
    title: `Collection: ${decodedTag}`,
    alternates: {
      canonical: `/tags/${encodeURIComponent(decodedTag)}`,
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  let products = await getProducts(60);
  products = products.filter((product) => hasExactTag(product, decodedTag));

  return (
    <section className="relative pb-8">
      <div className="mb-3 md:hidden">
        <ProductBackButton />
      </div>
      <div className="absolute -left-24 top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <ProductBackButton />
      </div>

      <header className="noise-panel rounded-lg p-5 sm:p-7">
        <h1 className="tomb-title mt-3 text-4xl sm:text-5xl">COLLECTION: {decodedTag}</h1>
        <p className="tomb-subtle mt-2 text-sm sm:text-base">
          Browse the full selection of {decodedTag} sold by The Tomb Video.
        </p>
      </header>

      <ProductSortPanel
        products={products}
        emptyMessage={`No products are currently tagged as ${decodedTag}.`}
      />
    </section>
  );
}
