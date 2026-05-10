import type { Metadata } from "next";
import { parseProductDescription } from "@/lib/product-metadata";
import { getProducts } from "@/lib/shopify";
import { validateProductMetadata } from "@/lib/metadata-validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Metadata QA",
  robots: {
    index: false,
    follow: false,
  },
};

function Badge({ ok, text }: { ok: boolean; text: string }) {
  return (
    <span
      className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
        ok
          ? "border-lime-300/65 bg-lime-300/15 text-lime-200"
          : "border-red-300/55 bg-red-500/15 text-red-200"
      }`}
    >
      {text}
    </span>
  );
}

export default async function MetadataQaPage() {
  const products = await getProducts();

  const rows = products
    .map((product) => {
      const validation = validateProductMetadata(product);
      const parsed = parseProductDescription(product);
      return {
        product,
        validation,
        parsed,
      };
    })
    .sort((a, b) => {
      if (a.validation.warnings.length !== b.validation.warnings.length) {
        return b.validation.warnings.length - a.validation.warnings.length;
      }
      return a.product.title.localeCompare(b.product.title);
    });

  const flaggedCount = rows.filter((row) => row.validation.warnings.length > 0).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-white/15 bg-black/45 p-5 sm:p-6">
        <h1 className="tomb-title text-3xl sm:text-4xl">Metadata QA</h1>
        <p className="tomb-subtle mt-2 max-w-4xl text-sm sm:text-base">
          Validation dashboard for product description schema. Expected format: line 1 = Media / Studio / Genre(s), line 2 = NEW|USED|PRE-OWNED, line 3 = Condition: ...
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-300">
          {rows.length} products checked, {flaggedCount} flagged
        </p>
      </header>

      <section className="space-y-3">
        {rows.map(({ product, validation, parsed }) => (
          <article key={product.id} className="rounded-lg border border-white/15 bg-black/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">{product.title}</h2>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-400">{product.handle}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge ok={validation.isHeaderValid} text="Line 1" />
                <Badge ok={validation.isOwnershipLineValid} text="Line 2" />
                <Badge ok={validation.isConditionLineValid} text="Line 3" />
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-black/35 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">Parsed metadata</p>
                <p className="mt-2 text-xs text-zinc-200">Ownership: {parsed.ownershipLine || "(none)"}</p>
                <p className="text-xs text-zinc-200">Condition: {parsed.conditionLine || "(none)"}</p>
                <p className="text-xs text-zinc-200">Studio: {parsed.studio || "(none)"}</p>
                <p className="text-xs text-zinc-200">Genres: {parsed.genres.join(", ") || "(none)"}</p>
              </div>

              <div className="rounded-md border border-white/10 bg-black/35 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">Description lines</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-zinc-200">
                  {validation.lines.slice(0, 5).map((line, index) => (
                    <li key={`${product.id}-line-${index}`}>{line}</li>
                  ))}
                </ol>
              </div>
            </div>

            {validation.warnings.length > 0 ? (
              <div className="mt-3 rounded-md border border-red-300/35 bg-red-500/10 p-3 text-xs text-red-100">
                <p className="mb-1 font-semibold uppercase tracking-[0.12em]">Warnings</p>
                <ul className="list-disc space-y-1 pl-4">
                  {validation.warnings.map((warning) => (
                    <li key={`${product.id}-${warning}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-lime-300/35 bg-lime-300/10 p-3 text-xs text-lime-100">
                Description schema looks valid.
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
