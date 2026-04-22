"use client";

import { useState } from "react";
import { useCart } from "./cart-provider";

type AddToCartButtonProps = {
  merchandiseId: string;
  productHandle: string;
  title: string;
  variantTitle: string;
  imageUrl?: string;
  priceAmount: string;
  currencyCode: string;
  availableForSale: boolean;
  maxQuantity: number;
};

export function AddToCartButton(props: AddToCartButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const { addItem, items } = useCart();
  const currentQuantity = items.find((item) => item.merchandiseId === props.merchandiseId)?.quantity ?? 0;
  const atQuantityLimit = currentQuantity >= props.maxQuantity;

  async function onClick() {
    if (atQuantityLimit) {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 1600);
      return;
    }

    setStatus("loading");
    try {
      await addItem(
        {
          merchandiseId: props.merchandiseId,
          productHandle: props.productHandle,
          title: props.title,
          variantTitle: props.variantTitle,
          imageUrl: props.imageUrl,
          priceAmount: props.priceAmount,
          currencyCode: props.currencyCode,
          maxQuantity: props.maxQuantity,
        },
        1,
      );
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 1600);
    }
  }

  if (!props.availableForSale) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-md border border-red-400/40 px-4 py-3 text-sm font-medium uppercase tracking-widest text-red-300/80"
      >
        Currently unavailable
      </button>
    );
  }

  return (
    <div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {status === "loading" && "Adding item to cart."}
        {status === "done" && "Added item to cart."}
        {status === "error" && (atQuantityLimit ? "Maximum quantity reached." : "Could not add item to cart.")}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={status === "loading" || atQuantityLimit}
        className="vhs-sticker-btn vhs-sticker-acid w-full text-xs disabled:opacity-70"
      >
        {status === "loading" && "Adding to cart..."}
        {status === "done" && "Added to cart"}
        {status === "error" && (atQuantityLimit ? "Max quantity reached" : "Could not add item. Try again")}
        {status === "idle" && "Add to cart"}
      </button>
    </div>
  );
}
