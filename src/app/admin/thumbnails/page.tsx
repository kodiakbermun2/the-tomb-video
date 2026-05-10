import type { Metadata } from "next";
import { ThumbnailAdminEditor } from "@/components/thumbnail-admin-editor";
import { getShopifyImageUrl } from "@/lib/shopify/image";
import { getProducts } from "@/lib/shopify";
import { getThumbnailOverridesForHandles } from "@/lib/thumbnail-overrides";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Thumbnail Overrides Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ThumbnailAdminPage() {
  const products = await getProducts();
  const thumbnailOverrides = await getThumbnailOverridesForHandles(
    products.map((product) => product.handle),
  );

  const options = products
    .map((product) => {
      const image = product.featuredImage ?? product.images.nodes[0] ?? null;
      return {
        handle: product.handle,
        title: product.title,
        imageUrl: image ? getShopifyImageUrl(image.url, 800) : null,
      };
    })
    .sort((a, b) => a.handle.localeCompare(b.handle));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-white/15 bg-black/45 p-5 sm:p-6">
        <h1 className="tomb-title text-3xl sm:text-4xl">Thumbnail Overrides</h1>
        <p className="tomb-subtle mt-2 max-w-3xl text-sm sm:text-base">
          Adjust product thumbnail crop and zoom, then save to Cloudflare KV. Saved values are used by all visitors across catalog cards and product-page carousels.
        </p>
        <a
          href="/admin/metadata"
          className="mt-3 inline-flex rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-100 transition hover:border-lime-300/70 hover:text-lime-300"
        >
          Open Metadata QA
        </a>
      </header>

      <ThumbnailAdminEditor products={options} initialOverrides={thumbnailOverrides} />
    </main>
  );
}
