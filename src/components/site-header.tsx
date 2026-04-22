"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useCart } from "@/components/cart-provider";

export function SiteHeader() {
  const { totalItems } = useCart();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const visibleTotalItems = isHydrated ? totalItems : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <Link href="/" className="tomb-title block whitespace-nowrap text-4xl font-black tracking-[0.16em] leading-none sm:text-6xl">
            The Tomb Video
          </Link>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Horror, sci-fi, cult films, vintage, physical media, used & new
          </p>
        </div>

        <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] sm:gap-3 sm:text-[11px]">
          <Link
            href="/"
            className="vhs-sticker-btn vhs-sticker-cream h-16 w-16 p-0 text-center text-[9px] leading-[1.05] sm:h-20 sm:w-20 sm:text-[10px]"
          >
            Catalog
          </Link>
          <Link
            href="/collections"
            className="vhs-sticker-btn vhs-sticker-acid h-16 w-16 p-0 text-center text-[8px] leading-[1.05] sm:h-20 sm:w-20 sm:text-[9px]"
          >
            Collections
          </Link>
          <Link
            href="/cart"
            className="rounded-full border border-lime-300/60 bg-lime-300/10 px-3 py-1.5 transition-colors hover:bg-lime-300/20"
          >
            Cart ({visibleTotalItems})
          </Link>
        </nav>
      </div>
    </header>
  );
}
