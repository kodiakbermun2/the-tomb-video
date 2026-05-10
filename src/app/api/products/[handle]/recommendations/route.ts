import { NextResponse } from "next/server";
import { getProductTags } from "@/lib/product-metadata";
import { getProducts } from "@/lib/shopify";
import { getThumbnailOverridesForHandles } from "@/lib/thumbnail-overrides";

export const dynamic = "force-dynamic";

function getSortableTokens(title: string) {
  return new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4),
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const { handle } = await context.params;
  const allProducts = await getProducts();
  const current = allProducts.find((entry) => entry.handle.toLowerCase() === handle.toLowerCase()) ?? null;

  if (!current) {
    return NextResponse.json({ relatedProducts: [], recentProducts: [], thumbnailOverrides: {} });
  }

  const baseTags = new Set(getProductTags(current).map((tag) => tag.toLowerCase()));
  const baseTitleTokens = getSortableTokens(current.title);

  const relatedProducts = allProducts
    .filter((candidate) => candidate.id !== current.id)
    .map((candidate) => {
      const candidateTags = getProductTags(candidate).map((tag) => tag.toLowerCase());
      const sharedTagScore = candidateTags.reduce(
        (score, tag) => score + (baseTags.has(tag) ? 1 : 0),
        0,
      );

      const candidateTitleTokens = getSortableTokens(candidate.title);
      let titleTokenTieBreak = 0;
      for (const token of candidateTitleTokens) {
        if (baseTitleTokens.has(token)) {
          titleTokenTieBreak += 1;
        }
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

  const thumbnailOverrides = await getThumbnailOverridesForHandles(
    allProducts.map((product) => product.handle),
  );

  return NextResponse.json({
    relatedProducts,
    recentProducts: allProducts,
    thumbnailOverrides,
  });
}
