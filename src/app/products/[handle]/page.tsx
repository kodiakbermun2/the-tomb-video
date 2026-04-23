import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { MoreLikeThisCarousel } from "@/components/more-like-this-carousel";
import { ProductBackButton } from "@/components/product-back-button";
import { ProductImageCarousel } from "@/components/product-image-carousel";
import { formatMoney } from "@/lib/format";
import { getMediaChipClass } from "@/lib/media-chip";
import { getProductTags, parseProductDescription } from "@/lib/product-metadata";
import { getBaseUrl } from "@/lib/site";
import { getProductByHandle, getProducts } from "@/lib/shopify";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

function getLetterboxdFilmLabel(url: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const filmIndex = segments.findIndex((segment) => segment.toLowerCase() === "film");
    const slug =
      filmIndex >= 0 && segments[filmIndex + 1]
        ? segments[filmIndex + 1]
        : segments[segments.length - 1] || "";

    const plain = decodeURIComponent(slug).replace(/-/g, " ").trim();
    if (!plain) {
      return "Film";
    }

    return plain
      .split(/\s+/)
      .map((word) => {
        if (/^[ivxlcdm]+$/i.test(word)) {
          return word.toUpperCase();
        }
        if (/^\d+$/.test(word)) {
          return word;
        }
        return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
      })
      .join(" ");
  } catch {
    return "Film";
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    return {
      title: "Missing Product",
    };
  }

  return {
    title: product.title,
    description: product.description,
    alternates: {
      canonical: `/products/${product.handle}`,
    },
    openGraph: {
      title: product.title,
      description: product.description,
      url: `${getBaseUrl()}/products/${product.handle}`,
      images: product.featuredImage ? [{ url: product.featuredImage.url }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const primaryVariant = product.variants.nodes[0];
  const image = product.featuredImage ?? product.images.nodes[0] ?? null;
  const galleryImages = [
    ...(product.featuredImage ? [product.featuredImage] : []),
    ...product.images.nodes,
  ].filter((entry, index, list) => list.findIndex((candidate) => candidate.url === entry.url) === index);
  const price = primaryVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = primaryVariant?.compareAtPrice;
  const showCompareAt = Boolean(compareAt) && Number(compareAt?.amount || 0) > Number(price.amount);
  const { mediaType, studio, genres, isOutOfPrint, ownershipLine, conditionLine, regionCode, detailsText, tags, letterboxdUrls } = parseProductDescription(product);
  const metadataMediaType = mediaType || product.productType || "media";
  const metadataStudio = studio || product.vendor || "Unknown Studio";
  const ownershipLower = ownershipLine.trim().toLowerCase();
  const ownershipChipClass = ownershipLower.startsWith("new")
    ? "border-lime-300/90 bg-[#c9ff37] text-black"
    : "border-zinc-400/70 bg-zinc-500/30 text-zinc-100";
  const normalizedRegionCode = regionCode.trim();
  const isRegionFree = /(?:region\s*[- ]*free|all\s*[- ]*region)/i.test(normalizedRegionCode);
  const isRegionNumber = /^\d$/.test(normalizedRegionCode);
  const isRegionLetter = /^[A-Za-z]$/.test(normalizedRegionCode);
  const availableQuantity = product.variants.nodes.reduce(
    (total, variant) => total + Math.max(0, variant.quantityAvailable ?? (variant.availableForSale ? 1 : 0)),
    0,
  );

  const allProducts = await getProducts(60);
  const baseTags = new Set(getProductTags(product).map((tag) => tag.toLowerCase()));
  const baseTitleTokens = new Set(
    product.title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4),
  );

  const relatedProducts = allProducts
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => {
      const candidateTags = getProductTags(candidate).map((tag) => tag.toLowerCase());
      const sharedTagScore = candidateTags.reduce(
        (score, tag) => score + (baseTags.has(tag) ? 1 : 0),
        0,
      );

      const candidateTitleTokens = new Set(
        candidate.title
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((token) => token.length >= 4),
      );
      let titleTokenTieBreak = 0;
      for (const token of candidateTitleTokens) {
        if (baseTitleTokens.has(token)) titleTokenTieBreak += 1;
      }

      return {
        candidate,
        sharedTagScore,
        titleTokenTieBreak,
      };
    })
    .filter((entry) => entry.sharedTagScore > 0)
    .sort((a, b) => {
      if (b.sharedTagScore !== a.sharedTagScore) {
        return b.sharedTagScore - a.sharedTagScore;
      }
      return b.titleTokenTieBreak - a.titleTokenTieBreak;
    })
    .slice(0, 12)
    .map((entry) => entry.candidate);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: galleryImages.map((entry) => entry.url),
    offers: {
      "@type": "Offer",
      priceCurrency: price.currencyCode,
      price: price.amount,
      availability: primaryVariant?.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${getBaseUrl()}/products/${product.handle}`,
    },
  };

  return (
    <>
      <article className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-10">
      <Script
        id={`product-jsonld-${product.handle}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="stagger-in relative">
        <div className="mb-3 md:hidden">
          <ProductBackButton />
        </div>
        <div className="absolute -left-24 top-1/2 z-30 hidden -translate-y-1/2 md:block">
          <ProductBackButton />
        </div>
        <div className="overflow-hidden rounded-lg border border-white/15 bg-black/45 p-3">
          <ProductImageCarousel
            images={galleryImages}
            title={product.title}
          />
        </div>
      </div>

      <div className="stagger-in flex flex-col rounded-lg border border-white/15 bg-black/45 p-5 md:p-7">
        <h1 className="tomb-title text-4xl leading-tight sm:text-5xl">{product.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-lg text-lime-300">{formatMoney(price.amount, price.currencyCode)}</p>
          {showCompareAt && compareAt ? (
            <span className="text-sm text-zinc-500 line-through">
              {formatMoney(compareAt.amount, compareAt.currencyCode)}
            </span>
          ) : null}
          <span
            className={`shop-metadata-chip ${
              primaryVariant?.availableForSale
                ? ""
                : "border-red-400/70 bg-red-500/25 text-red-100"
            }`}
          >
            {primaryVariant?.availableForSale ? "In Stock" : "Sold Out"}
          </span>
          <span className="shop-metadata-chip border-lime-300/55 bg-lime-300/10 text-lime-100">
            {availableQuantity} available
          </span>
          {isOutOfPrint ? (
            <span className="shop-metadata-chip border-white/80 bg-white !text-black" style={{ color: "#000" }}>
              Out of print
            </span>
          ) : null}
        </div>

        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className={`shop-metadata-chip ${getMediaChipClass(metadataMediaType)}`}>
              {metadataMediaType}
            </span>
            <span className="shop-metadata-chip">{metadataStudio}</span>
            {genres.length > 0
              ? genres.map((genre) => (
                  <span key={genre} className="shop-metadata-chip">
                    {genre}
                  </span>
                ))
              : null}
          </div>

          {ownershipLine ? (
            <div className={`mb-2 inline-flex rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${ownershipChipClass}`}>
              {ownershipLine}
            </div>
          ) : null}

          {conditionLine ? (
            <div className="mb-3 block w-fit rounded-md border border-white/25 bg-black/35 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-200">
              {conditionLine}
            </div>
          ) : null}

          <p className="tomb-subtle whitespace-pre-wrap text-sm leading-relaxed sm:text-base">
            {detailsText || product.description || "No product description available yet."}
          </p>

          {normalizedRegionCode ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase text-zinc-300">
              <span className="text-zinc-400">Region Code:</span>
              {isRegionFree ? (
                <span className="shop-metadata-chip">{normalizedRegionCode}</span>
              ) : isRegionNumber ? (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/40 text-[11px] font-black text-zinc-100">
                  {normalizedRegionCode}
                </span>
              ) : isRegionLetter ? (
                <span className="inline-flex h-8 w-8 items-center justify-center" aria-label={`Region ${normalizedRegionCode.toUpperCase()}`}>
                  <svg viewBox="0 0 100 100" className="h-8 w-8" aria-hidden="true">
                    <polygon
                      points="25,8 75,8 96,50 75,92 25,92 4,50"
                      fill="rgba(10,10,10,0.65)"
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="4"
                    />
                    <text
                      x="50"
                      y="58"
                      textAnchor="middle"
                      fontSize="34"
                      fontWeight="900"
                      fill="#f4f4f5"
                    >
                      {normalizedRegionCode.toUpperCase()}
                    </text>
                  </svg>
                </span>
              ) : (
                <span className="shop-metadata-chip">{normalizedRegionCode}</span>
              )}
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="shop-metadata-chip transition hover:border-lime-300/70 hover:text-lime-300"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}

          {letterboxdUrls.length > 0 ? (
            <div className="mt-4 flex flex-col gap-2">
              {letterboxdUrls.map((url, index) => (
                <div key={url} className="flex flex-wrap items-center gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/45 px-3 py-2 text-xs uppercase tracking-[0.18em] text-zinc-100 transition hover:border-lime-300/70 hover:text-lime-300"
                  >
                    <span className="inline-flex items-center gap-1" aria-hidden="true">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#00E054]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF8000]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#40BCF4]" />
                    </span>
                    View on Letterboxd
                  </a>
                  {letterboxdUrls.length > 1 ? (
                    <span className="text-xs text-zinc-400">{getLetterboxdFilmLabel(url) || `Film ${index + 1}`}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {primaryVariant ? (
          <div className="mt-6">
            <AddToCartButton
              merchandiseId={primaryVariant.id}
              productHandle={product.handle}
              title={product.title}
              variantTitle={primaryVariant.title}
              imageUrl={image?.url}
              priceAmount={price.amount}
              currencyCode={price.currencyCode}
              availableForSale={primaryVariant.availableForSale}
              maxQuantity={Math.max(1, availableQuantity)}
            />
          </div>
        ) : (
          <div className="mt-6 rounded-md border border-red-400/40 px-4 py-3 text-sm text-red-200">
            This product is currently unavailable. No purchasable variant found.
          </div>
        )}
      </div>
      </article>

      <MoreLikeThisCarousel products={relatedProducts} />
    </>
  );
}
