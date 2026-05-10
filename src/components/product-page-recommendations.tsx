"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Product } from "@/lib/shopify/types";
import { type ThumbnailOverrideMap } from "@/lib/thumbnail-overrides";

const MoreLikeThisCarousel = dynamic(
  () => import("./more-like-this-carousel").then((module) => module.MoreLikeThisCarousel),
  { ssr: false },
);

const RecentlyViewedCarousel = dynamic(
  () => import("./recently-viewed-carousel").then((module) => module.RecentlyViewedCarousel),
  { ssr: false },
);

type ProductPageRecommendationsProps = {
  currentHandle: string;
};

type RecommendationsResponse = {
  relatedProducts: Product[];
  recentProducts: Product[];
  thumbnailOverrides: ThumbnailOverrideMap;
};

export function ProductPageRecommendations({ currentHandle }: ProductPageRecommendationsProps) {
  const [payload, setPayload] = useState<RecommendationsResponse | null>(null);
  const [hydrateCarousels, setHydrateCarousels] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return !window.matchMedia("(max-width: 767px)").matches;
  });
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(currentHandle)}/recommendations`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as RecommendationsResponse;
        if (!cancelled) {
          setPayload(data);
        }
      } catch {
        // Keep carousels hidden on fetch errors to avoid rendering stale placeholders.
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [currentHandle]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const prefersMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!prefersMobile || hydrateCarousels) {
      return;
    }

    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHydrateCarousels(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "220px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [hydrateCarousels]);

  if (!payload) {
    return (
      <section ref={anchorRef} className="mt-8 rounded-xl border border-white/15 bg-black/60 p-4 sm:p-5">
        <div className="rounded-md border border-white/15 bg-black/35 p-4 text-sm text-zinc-400">
          Loading related titles...
        </div>
      </section>
    );
  }

  if (!hydrateCarousels) {
    return (
      <section ref={anchorRef} className="mt-8 rounded-xl border border-white/15 bg-black/60 p-4 sm:p-5">
        <div className="rounded-md border border-white/15 bg-black/35 p-4 text-sm text-zinc-400">
          Scroll for related and recently viewed titles...
        </div>
      </section>
    );
  }

  return (
    <div ref={anchorRef}>
      <MoreLikeThisCarousel
        products={payload.relatedProducts}
        thumbnailOverrides={payload.thumbnailOverrides}
      />
      <RecentlyViewedCarousel
        currentHandle={currentHandle}
        products={payload.recentProducts}
        thumbnailOverrides={payload.thumbnailOverrides}
      />
    </div>
  );
}
