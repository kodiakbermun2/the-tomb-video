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
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
        <div className="min-w-0">
          <Link href="/" className="tomb-title block text-3xl font-black leading-none tracking-[0.12em] sm:text-6xl sm:tracking-[0.16em]">
            The Tomb Video
          </Link>
          <p className="mt-1 max-w-xl text-[9px] leading-tight uppercase tracking-[0.15em] text-zinc-400 sm:text-[10px] sm:tracking-[0.2em]">
            Horror, sci-fi, cult films, vintage, physical media, used & new
          </p>
        </div>

        <nav className="flex w-full items-center justify-between gap-2 text-xs uppercase tracking-[0.18em] sm:w-auto sm:justify-start sm:gap-3 sm:text-[11px]">
          <Link
            href="/"
            className="vhs-sticker-btn vhs-sticker-cream h-10 px-3 py-0 text-center text-[9px] leading-none sm:h-20 sm:w-20 sm:px-0 sm:text-[10px]"
          >
            Catalog
          </Link>
          <Link
            href="/collections"
            className="vhs-sticker-btn vhs-sticker-acid h-10 px-3 py-0 text-center text-[9px] leading-none sm:h-20 sm:w-20 sm:px-0 sm:text-[9px]"
          >
            Collections
          </Link>
          <Link
            href="/bargain-bin"
            className="vhs-sticker-btn h-10 px-3 py-0 text-center text-[10px] leading-none border-sky-300/85 bg-sky-300 !text-black sm:h-20 sm:w-20 sm:px-0 sm:text-[11px]"
          >
            Bargain Bin
          </Link>
          <Link
            href="/cart"
            className="inline-flex h-10 items-center justify-center rounded-full border border-lime-300/60 bg-lime-300/10 px-2.5 text-center text-[11px] tracking-[0.12em] transition-colors hover:bg-lime-300/20 sm:h-auto sm:px-3 sm:text-inherit sm:tracking-[0.18em]"
          >
            Cart ({visibleTotalItems})
          </Link>
        </nav>
      </div>
    </header>
  );
}
