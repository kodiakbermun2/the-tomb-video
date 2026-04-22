"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getShopifyImageUrl } from "@/lib/shopify/image";
import { ShopifyImage } from "@/lib/shopify/types";

type ProductImageCarouselProps = {
  images: ShopifyImage[];
  title: string;
};

export function ProductImageCarousel({ images, title }: ProductImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const safeImages = useMemo(
    () => images.filter((image) => Boolean(image?.url)),
    [images],
  );

  if (safeImages.length === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-md bg-zinc-900 text-xs uppercase tracking-widest text-zinc-500">
        No Art Available
      </div>
    );
  }

  const active = safeImages[index];
  const canNavigate = safeImages.length > 1;

  function goNext() {
    if (!canNavigate) return;
    setIndex((prev) => (prev + 1) % safeImages.length);
  }

  function goPrev() {
    if (!canNavigate) return;
    setIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  }

  function zoomIn() {
    setZoomLevel((prev) => Math.min(4, Number((prev + 0.25).toFixed(2))));
  }

  function zoomOut() {
    setZoomLevel((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))));
  }

  function resetZoom() {
    setZoomLevel(1);
    setZoomOrigin({ x: 50, y: 50 });
  }

  function onImageMove(event: React.MouseEvent<HTMLDivElement>) {
    if (zoomLevel <= 1) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  return (
    <div>
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-md bg-zinc-900 ${
          zoomLevel > 1 ? "cursor-move" : "cursor-default"
        }`}
        onMouseMove={onImageMove}
      >
        <div className="absolute inset-0 z-[1]">
          <Image
            src={getShopifyImageUrl(active.url, 1200)}
            alt={active.altText ?? title}
            fill
            sizes="(max-width: 768px) 100vw, 52vw"
            className="object-cover"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
            }}
            priority
          />
        </div>

        {canNavigate ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/25 bg-black/55 px-3 py-2 text-lg text-zinc-100 transition hover:border-lime-300/70 hover:text-lime-300"
            >
              {"<"}
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/25 bg-black/55 px-3 py-2 text-lg text-zinc-100 transition hover:border-lime-300/70 hover:text-lime-300"
            >
              {">"}
            </button>
            <div className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-100">
              {index + 1} / {safeImages.length}
            </div>
          </>
        ) : null}

        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Increase magnification"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/60 text-zinc-100 transition hover:border-lime-300/70 hover:text-lime-300"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M15 15L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Decrease magnification"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/60 text-zinc-100 transition hover:border-lime-300/70 hover:text-lime-300"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M15 15L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M7 10h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          {zoomLevel > 1 ? (
            <>
              <span className="rounded-md border border-white/20 bg-black/60 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-100">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={resetZoom}
                aria-label="Reset magnification"
                className="rounded-md border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-100 transition hover:border-lime-300/70 hover:text-lime-300"
              >
                Reset
              </button>
            </>
          ) : null}
        </div>
      </div>

      {safeImages.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {safeImages.map((image, imageIndex) => (
            <button
              key={`${image.url}-${imageIndex}`}
              type="button"
              onClick={() => setIndex(imageIndex)}
              className={`relative aspect-square overflow-hidden rounded border transition ${
                imageIndex === index
                  ? "border-lime-300/80"
                  : "border-white/20 hover:border-white/40"
              }`}
              aria-label={`Show photo ${imageIndex + 1}`}
            >
              <Image
                src={getShopifyImageUrl(image.url, 220)}
                alt={image.altText ?? `${title} photo ${imageIndex + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
