import { Product } from "@/lib/shopify/types";
import { parseProductDescription } from "@/lib/product-metadata";

const FORMAT_KEYWORDS = [
  "ced",
  "capacitance electronic disc",
  "vhs",
  "dvd",
  "blu-ray",
  "bluray",
  "4k",
  "laserdisc",
  "laser disc",
  "cd",
  "compact disc",
  "vinyl",
  "lp",
  "cassette",
  "magazine",
  "zine",
  "book",
  "poster",
  "apparel",
] as const;

const LEADING_ARTICLE_PATTERN = /^(?:the|a|an)\s+/i;

export function normalizeFormatLabel(value: string) {
  if (value === "bluray") return "blu-ray";
  if (value === "compact disc") return "cd";
  if (value === "capacitance electronic disc") return "ced";
  if (value === "laser disc") return "laserdisc";
  if (value === "lp") return "vinyl";
  if (value === "zine") return "magazine";
  return value;
}

function escapeRegexLiteral(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesFormat(searchCorpus: string, keyword: string) {
  // Use word boundaries for short tokens like cd/lp to avoid accidental matches.
  if (keyword.length <= 2) {
    const tokenPattern = new RegExp(`\\b${escapeRegexLiteral(keyword)}\\b`, "i");
    return tokenPattern.test(searchCorpus);
  }

  return searchCorpus.includes(keyword);
}

export function getSortableTitle(title: string) {
  return title.trim().replace(LEADING_ARTICLE_PATTERN, "");
}

export function getProductFormats(product: Product) {
  const parsed = parseProductDescription(product);
  const mediaType = parsed.mediaType.toLowerCase();

  if (!mediaType) {
    return [];
  }

  const normalized = FORMAT_KEYWORDS
    .filter((keyword) => includesFormat(mediaType, keyword))
    .map(normalizeFormatLabel);

  return Array.from(new Set(normalized));
}

export function getAvailableFormats(products: Product[]) {
  const unique = new Set<string>();

  for (const product of products) {
    for (const format of getProductFormats(product)) {
      unique.add(format);
    }
  }

  return Array.from(unique).sort();
}

export function filterProducts(products: Product[], query: string, format: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedFormat = format.trim().toLowerCase();

  return products.filter((product) => {
    const inText =
      normalizedQuery.length === 0 ||
      [product.title, product.description, ...(product.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    if (!inText) {
      return false;
    }

    if (normalizedFormat.length === 0) {
      return true;
    }

    const formats = getProductFormats(product);
    return formats.includes(normalizeFormatLabel(normalizedFormat));
  });
}
