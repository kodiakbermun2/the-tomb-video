import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductBackButton } from "@/components/product-back-button";
import { ProductSortPanel } from "@/components/product-sort-panel";
import { getCollectionByHandle } from "@/lib/shopify";

type CollectionPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle, 1);

  if (!collection) {
    return { title: "Collection Missing" };
  }

  return {
    title: collection.title,
    description: collection.description || `Shop ${collection.title} at The Tomb Video.`,
    alternates: {
      canonical: `/collections/${collection.handle}`,
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle, 36);

  if (!collection) {
    notFound();
  }

  const products = collection.products?.nodes ?? [];

  return (
    <section className="relative pb-8">
      <div className="mb-3 md:hidden">
        <ProductBackButton />
      </div>
      <div className="absolute -left-24 top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <ProductBackButton />
      </div>

      <header className="noise-panel rounded-lg p-5 sm:p-7">
        <h1 className="tomb-title mt-2 text-5xl leading-[0.9] sm:text-6xl">{collection.title}</h1>
        <p className="tomb-subtle mt-3 max-w-2xl text-sm sm:text-base">
          {collection.description || "A hand-picked pile from the filth vault."}
        </p>
      </header>

      <ProductSortPanel products={products} />
    </section>
  );
}
