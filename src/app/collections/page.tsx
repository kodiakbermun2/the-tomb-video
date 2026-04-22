import type { Metadata } from "next";
import Link from "next/link";
import { ProductBackButton } from "@/components/product-back-button";
import { getProductTags } from "@/lib/product-metadata";
import { getProducts } from "@/lib/shopify";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Collections",
  alternates: {
    canonical: "/collections",
  },
};

function hashTag(tag: string) {
  let hash = 0;
  for (let index = 0; index < tag.length; index += 1) {
    hash = (hash * 31 + tag.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export default async function CollectionsPage() {
  const products = await getProducts(80);
  const allTags = new Set<string>();

  for (const product of products) {
    for (const tag of getProductTags(product)) {
      allTags.add(tag);
    }
  }

  const tags = Array.from(allTags).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  const stickerColors = [
    "vhs-sticker-acid",
    "vhs-sticker-cream",
    "vhs-sticker-pink",
    "vhs-sticker-orange",
    "vhs-sticker-red",
  ];
  const stickerTilts = ["vhs-sticker-tilt-left", "", "vhs-sticker-tilt-right"];

  return (
    <section className="relative pb-8">
      <div className="mb-3 md:hidden">
        <ProductBackButton />
      </div>
      <div className="absolute -left-24 top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <ProductBackButton />
      </div>

      <header className="noise-panel rounded-lg p-5 sm:p-7">
        <p className="text-xs uppercase tracking-[0.24em] text-lime-300/90">Browse by tags</p>
        <h1 className="tomb-title mt-2 text-5xl leading-[0.9] sm:text-6xl">SHOP COLLECTIONS</h1>
        <p className="tomb-subtle mt-3 max-w-2xl text-sm sm:text-base">
          Jump straight into exact themes, formats, and franchises.
        </p>
      </header>

      <div className="mt-6">
        {tags.length === 0 ? (
          <div className="rounded-lg border border-white/15 bg-black/45 p-6 text-sm text-zinc-300">
            No tags found yet. Add a tags line in product descriptions to build this view.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {tags.map((tag) => {
              const hash = hashTag(tag);
              const color = stickerColors[hash % stickerColors.length];
              const tilt = stickerTilts[(hash >> 3) % stickerTilts.length];

              return (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className={`vhs-sticker-btn h-[5.5rem] w-[5.5rem] justify-center self-center justify-self-center p-2 text-center text-[11px] font-black tracking-[0.08em] leading-[1.05] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:h-28 sm:w-28 sm:text-[13px] ${color} ${tilt}`}
                >
                  {tag}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
