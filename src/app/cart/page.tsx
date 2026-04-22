"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSyncExternalStore } from "react";
import { ProductBackButton } from "@/components/product-back-button";
import { formatMoney } from "@/lib/format";
import { getShopifyImageUrl } from "@/lib/shopify/image";
import { useCart } from "@/components/cart-provider";

export default function CartPage() {
  const {
    items,
    checkoutUrl,
    totalItems,
    removeItem,
    clearCart,
    increaseItemQuantity,
    decreaseItemQuantity,
  } = useCart();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [liveMessage, setLiveMessage] = useState("");

  const announce = (message: string) => {
    setLiveMessage("");
    queueMicrotask(() => {
      setLiveMessage(message);
    });
  };

  const total = items.reduce(
    (sum, item) => sum + Number(item.priceAmount) * item.quantity,
    0,
  );

  const currency = items[0]?.currencyCode ?? "USD";

  const handleIncrease = async (merchandiseId: string, title: string) => {
    try {
      await increaseItemQuantity(merchandiseId);
      announce(`Increased quantity for ${title}.`);
    } catch {
      announce(`Could not increase quantity for ${title}.`);
    }
  };

  const handleDecrease = async (merchandiseId: string, title: string) => {
    try {
      await decreaseItemQuantity(merchandiseId);
      announce(`Updated quantity for ${title}.`);
    } catch {
      announce(`Could not decrease quantity for ${title}.`);
    }
  };

  const handleRemove = async (merchandiseId: string, title: string) => {
    try {
      await removeItem(merchandiseId);
      announce(`Removed ${title} from cart.`);
    } catch {
      announce(`Could not remove ${title} from cart.`);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      announce("Cleared cart.");
    } catch {
      announce("Could not clear cart.");
    }
  };

  if (!isHydrated || items.length === 0) {
    return (
      <section className="relative pb-8">
        <div className="mb-3 md:hidden">
          <ProductBackButton />
        </div>
        <div className="absolute -left-24 top-1/2 z-30 hidden -translate-y-1/2 md:block">
          <ProductBackButton />
        </div>

        <div className="noise-panel rounded-lg p-6 sm:p-8">
          <h1 className="tomb-title text-4xl">Your cart is empty</h1>
          <p className="tomb-subtle mt-3 text-sm sm:text-base">
            Add an item to continue to checkout.
          </p>
          <Link
            href="/"
            className="vhs-sticker-btn vhs-sticker-acid vhs-sticker-tilt-left mt-6 text-[10px]"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative pb-8">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>
      <div className="mb-3 md:hidden">
        <ProductBackButton />
      </div>
      <div className="absolute -left-24 top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <ProductBackButton />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.merchandiseId}
              className="flex gap-3 rounded-lg border border-white/15 bg-black/55 p-3"
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-zinc-900">
                {item.imageUrl ? (
                  <Image
                    src={getShopifyImageUrl(item.imageUrl, 160)}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100 sm:text-base">{item.title}</h2>
                  <p className="mt-1 text-xs uppercase tracking-wider text-zinc-400">
                    {item.variantTitle}
                  </p>
                  <p className="mt-2 text-sm text-lime-300">
                    {formatMoney(item.priceAmount, item.currencyCode)} x {item.quantity}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-white/20 bg-black/35 p-1">
                    <button
                      type="button"
                      onClick={() => handleDecrease(item.merchandiseId, item.title)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/25 text-sm text-zinc-200 transition hover:border-lime-300/70 hover:text-lime-300"
                      aria-label={`Decrease quantity of ${item.title}`}
                    >
                      -
                    </button>
                    <span className="min-w-6 text-center text-xs font-semibold text-zinc-100">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleIncrease(item.merchandiseId, item.title)}
                      disabled={item.quantity >= item.maxQuantity}
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/25 text-sm text-zinc-200 transition hover:border-lime-300/70 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Increase quantity of ${item.title}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.merchandiseId, item.title)}
                  className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="noise-panel h-fit rounded-lg p-5">
          <h2 className="tomb-title text-3xl">Order summary</h2>
          <p className="mt-4 flex items-center justify-between text-sm">
            <span className="text-zinc-300">Items</span>
            <span>{totalItems}</span>
          </p>
          <p className="mt-2 flex items-center justify-between text-sm">
            <span className="text-zinc-300">Subtotal</span>
            <span>{formatMoney(String(total), currency)}</span>
          </p>

          <a
            href={checkoutUrl ?? "#"}
            className="vhs-sticker-btn vhs-sticker-pink vhs-sticker-tilt-right mt-5 w-full text-[10px]"
          >
            Checkout securely
          </a>

          <button
            type="button"
            onClick={handleClearCart}
            className="vhs-sticker-btn vhs-sticker-cream mt-3 w-full text-[10px]"
          >
            Clear cart
          </button>
        </aside>
      </div>
    </section>
  );
}
