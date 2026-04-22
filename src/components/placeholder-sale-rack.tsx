import { placeholderSaleItems } from "@/lib/placeholder-items";

export function PlaceholderSaleRack() {
  return (
    <section className="mt-6 shelf-panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="tomb-title text-3xl leading-none sm:text-4xl">Sample inventory preview</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-400">
            Placeholder products to preview layout and merchandising density
          </p>
        </div>
        <span className="vhs-sticker-btn vhs-sticker-pink text-[9px]">preview only</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {placeholderSaleItems.map((item) => (
          <article
            key={item.id}
            className="relative overflow-hidden rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(25,22,22,0.95),rgba(8,8,8,0.96))] p-2.5"
          >
            <span
              className={`absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-black/70 text-[8px] font-black uppercase tracking-[0.08em] text-black ${
                item.badge === "sale"
                  ? "bg-pink-300"
                  : item.badge === "rare"
                    ? "bg-amber-300"
                    : "bg-lime-300"
              }`}
            >
              {item.badge || "new"}
            </span>

            <div className="mb-2 grid aspect-square place-items-center rounded-lg border border-white/10 bg-zinc-900 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {item.format}
              <br />
              cover slot
            </div>

            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              {item.era} • {item.condition}
            </p>
            <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-100">{item.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{item.tagline}</p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="shop-metadata-chip">{item.format}</span>
              <span className="shop-metadata-chip">shop copy</span>
            </div>

            <div className="mt-3 flex items-end justify-between">
              {item.salePrice ? (
                <>
                  <p className="text-xs text-zinc-500 line-through">{item.price}</p>
                  <p className="text-base font-bold text-lime-300">{item.salePrice}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-500">regular</p>
                  <p className="text-base font-bold text-zinc-100">{item.price}</p>
                </>
              )}
            </div>

            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Packed clean • ships quick
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
