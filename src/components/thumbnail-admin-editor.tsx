"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { type ThumbnailOverrideMap } from "@/lib/thumbnail-overrides";

type AdminProductOption = {
  handle: string;
  title: string;
  imageUrl: string | null;
};

type ThumbnailAdminEditorProps = {
  products: AdminProductOption[];
  initialOverrides: ThumbnailOverrideMap;
};

const DEFAULT_X = 50;
const DEFAULT_Y = 50;
const DEFAULT_ZOOM = 1;
const GUIDE_MIN_FRAME_PERCENT = 18;

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatZoom(value: number) {
  return `${value.toFixed(2)}x`;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getGuideFramePercent(zoom: number) {
  return clampPercent(Math.max(GUIDE_MIN_FRAME_PERCENT, 100 / zoom));
}

function clampCenterToFrame(value: number, framePercent: number) {
  const half = framePercent / 2;
  return Math.min(100 - half, Math.max(half, value));
}

export function ThumbnailAdminEditor({ products, initialOverrides }: ThumbnailAdminEditorProps) {
  const initialHandle = products[0]?.handle ?? "";
  const initialOverride = initialHandle ? initialOverrides[initialHandle.toLowerCase()] : null;

  const [adminKey, setAdminKey] = useState("");
  const [overrides, setOverrides] = useState<ThumbnailOverrideMap>(initialOverrides);
  const [selectedHandle, setSelectedHandle] = useState(initialHandle);
  const [x, setX] = useState(initialOverride?.x ?? DEFAULT_X);
  const [y, setY] = useState(initialOverride?.y ?? DEFAULT_Y);
  const [zoom, setZoom] = useState(initialOverride?.zoom ?? DEFAULT_ZOOM);
  const [status, setStatus] = useState<string>("Ready");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [galleryQuery, setGalleryQuery] = useState("");
  const activePointerRef = useRef<number | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.handle === selectedHandle) ?? null,
    [products, selectedHandle],
  );

  const selectedOverride = useMemo(() => {
    if (!selectedHandle) {
      return null;
    }

    return overrides[selectedHandle.toLowerCase()] ?? null;
  }, [overrides, selectedHandle]);

  const guideFramePercent = useMemo(() => getGuideFramePercent(zoom), [zoom]);
  const clampedGuideX = useMemo(
    () => clampCenterToFrame(x, guideFramePercent),
    [x, guideFramePercent],
  );
  const clampedGuideY = useMemo(
    () => clampCenterToFrame(y, guideFramePercent),
    [y, guideFramePercent],
  );

  const guideFrameLeft = clampedGuideX - guideFramePercent / 2;
  const guideFrameTop = clampedGuideY - guideFramePercent / 2;

  const filteredProducts = useMemo(() => {
    const query = galleryQuery.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const title = product.title.toLowerCase();
      const handle = product.handle.toLowerCase();
      return title.includes(query) || handle.includes(query);
    });
  }, [galleryQuery, products]);

  function syncFromStoredOverride(nextHandle: string) {
    const override = overrides[nextHandle.toLowerCase()];
    if (!override) {
      setX(DEFAULT_X);
      setY(DEFAULT_Y);
      setZoom(DEFAULT_ZOOM);
      return;
    }

    const framePercent = getGuideFramePercent(override.zoom);
    setX(clampCenterToFrame(override.x, framePercent));
    setY(clampCenterToFrame(override.y, framePercent));
    setZoom(override.zoom);
  }

  function setPositionFromPointer(clientX: number, clientY: number, element: HTMLDivElement) {
    const bounds = element.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return;
    }

    const rawX = ((clientX - bounds.left) / bounds.width) * 100;
    const rawY = ((clientY - bounds.top) / bounds.height) * 100;
    const nextX = clampCenterToFrame(clampPercent(rawX), guideFramePercent);
    const nextY = clampCenterToFrame(clampPercent(rawY), guideFramePercent);

    setX(nextX);
    setY(nextY);
  }

  function handlePreviewPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!selectedProduct?.imageUrl) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    activePointerRef.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    setPositionFromPointer(event.clientX, event.clientY, event.currentTarget);
  }

  function handlePreviewPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || activePointerRef.current !== event.pointerId) {
      return;
    }

    setPositionFromPointer(event.clientX, event.clientY, event.currentTarget);
  }

  function handlePreviewPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    activePointerRef.current = null;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  async function saveOverride() {
    if (!selectedHandle) {
      setStatus("Pick a product handle first.");
      return;
    }

    if (!adminKey.trim()) {
      setStatus("Enter admin key first.");
      return;
    }

    setBusy(true);
    setStatus("Saving override...");

    try {
      const response = await fetch("/api/admin/thumbnail-overrides", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ handle: selectedHandle, x, y, zoom }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error || "Could not save override.");
        return;
      }

      setOverrides((previous) => ({
        ...previous,
        [selectedHandle.toLowerCase()]: {
          x,
          y,
          zoom,
          updatedAt: new Date().toISOString(),
        },
      }));
      setStatus("Saved. Storefront now uses this crop globally.");
    } catch {
      setStatus("Network error while saving override.");
    } finally {
      setBusy(false);
    }
  }

  async function removeOverride() {
    if (!selectedHandle) {
      setStatus("Pick a product handle first.");
      return;
    }

    if (!adminKey.trim()) {
      setStatus("Enter admin key first.");
      return;
    }

    setBusy(true);
    setStatus("Removing override...");

    try {
      const response = await fetch("/api/admin/thumbnail-overrides", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ handle: selectedHandle }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error || "Could not remove override.");
        return;
      }

      setOverrides((previous) => {
        const next = { ...previous };
        delete next[selectedHandle.toLowerCase()];
        return next;
      });
      setX(DEFAULT_X);
      setY(DEFAULT_Y);
      setZoom(DEFAULT_ZOOM);
      setStatus("Override removed. Using default crop again.");
    } catch {
      setStatus("Network error while removing override.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-white/15 bg-black/50 p-4 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <div>
            <label htmlFor="thumb-admin-key" className="mb-1 block text-xs uppercase tracking-[0.18em] text-zinc-300">
              Admin Key
            </label>
            <input
              id="thumb-admin-key"
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-300/70"
              placeholder="Enter THUMBNAIL_ADMIN_KEY"
            />
          </div>

          <div>
            <label htmlFor="thumb-handle" className="mb-1 block text-xs uppercase tracking-[0.18em] text-zinc-300">
              Selected Product
            </label>
            <input
              id="thumb-handle"
              value={selectedHandle ? `${selectedHandle} - ${selectedProduct?.title ?? ""}` : ""}
              className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-300/70"
              readOnly
            />
          </div>

          <p className="rounded-md border border-white/15 bg-black/35 px-3 py-2 text-xs text-zinc-300">
            Drag the dotted frame over the full cover art. The square frame represents the home thumbnail crop.
          </p>

          <div>
            <label htmlFor="thumb-zoom" className="mb-1 block text-xs uppercase tracking-[0.18em] text-zinc-300">
              Zoom ({formatZoom(zoom)})
            </label>
            <input
              id="thumb-zoom"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => {
                const nextZoom = Number(event.target.value);
                const nextFramePercent = getGuideFramePercent(nextZoom);
                setZoom(nextZoom);
                setX((previous) => clampCenterToFrame(previous, nextFramePercent));
                setY((previous) => clampCenterToFrame(previous, nextFramePercent));
              }}
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveOverride}
              disabled={busy || !selectedHandle}
              className="rounded-md border border-lime-300/60 bg-lime-300/15 px-3 py-2 text-sm font-semibold text-lime-200 transition hover:bg-lime-300/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Override
            </button>
            <button
              type="button"
              onClick={removeOverride}
              disabled={busy || !selectedHandle}
              className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset To Default
            </button>
          </div>

          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{status}</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">Full Cover Guide</p>
          <div
            className={`relative overflow-hidden rounded-lg border border-white/20 bg-zinc-900 touch-none ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ aspectRatio: "4 / 5" }}
            onPointerDown={handlePreviewPointerDown}
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={handlePreviewPointerUp}
            onPointerCancel={handlePreviewPointerUp}
            onLostPointerCapture={() => {
              activePointerRef.current = null;
              setDragging(false);
            }}
          >
            {selectedProduct?.imageUrl ? (
              <Image
                src={selectedProduct.imageUrl}
                alt={selectedProduct.title}
                fill
                sizes="(max-width: 1024px) 80vw, 420px"
                className="h-full w-full object-contain select-none pointer-events-none"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                No product image available for this item.
              </div>
            )}

            {selectedProduct?.imageUrl ? (
              <div
                className="pointer-events-none absolute border-2 border-dashed border-lime-300/90"
                style={{
                  width: `${guideFramePercent}%`,
                  aspectRatio: "1 / 1",
                  left: `${guideFrameLeft}%`,
                  top: `${guideFrameTop}%`,
                }}
              />
            ) : null}
          </div>

          <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">Home Thumbnail Preview</p>
          <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-lg border border-white/20 bg-zinc-900">
            {selectedProduct?.imageUrl ? (
              <Image
                src={selectedProduct.imageUrl}
                alt={selectedProduct.title}
                fill
                sizes="280px"
                className="object-cover"
                style={{
                  objectPosition: `${x}% ${y}%`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              />
            ) : null}
          </div>

          <div className="rounded-md border border-white/15 bg-black/35 px-3 py-2 text-xs text-zinc-300">
            <p>
              Active override: {selectedOverride ? "Yes" : "No"}
            </p>
            <p>Handle: {selectedHandle || "None"}</p>
            <p>
              Position: {formatPercent(x)} / {formatPercent(y)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-300">Select Product From Gallery</p>
        <input
          type="text"
          value={galleryQuery}
          onChange={(event) => setGalleryQuery(event.target.value)}
          className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-300/70"
          placeholder="Filter by title or handle"
        />
        <div className="grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const isSelected = product.handle === selectedHandle;
            return (
              <button
                key={product.handle}
                type="button"
                onClick={() => {
                  setSelectedHandle(product.handle);
                  syncFromStoredOverride(product.handle);
                  setStatus(`Selected ${product.title}`);
                }}
                className={`rounded-md border p-2 text-left transition ${
                  isSelected
                    ? "border-lime-300/80 bg-lime-300/15"
                    : "border-white/15 bg-black/30 hover:border-lime-300/45"
                }`}
              >
                <div className="relative mb-2 aspect-square overflow-hidden rounded bg-zinc-900">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.title} fill sizes="120px" className="object-cover" />
                  ) : null}
                </div>
                <p className="line-clamp-2 text-xs font-semibold text-zinc-100">{product.title}</p>
                <p className="mt-1 line-clamp-1 text-[10px] uppercase tracking-[0.08em] text-zinc-400">
                  {product.handle}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
