import { Product } from "@/lib/shopify/types";

const FORMAT_KEYWORDS = [
  "vhs",
  "dvd",
  "blu-ray",
  "bluray",
  "4k",
  "laserdisc",
  "vinyl",
  "cassette",
  "book",
  "poster",
  "apparel",
] as const;

export function normalizeFormatLabel(value: string) {
  if (value === "bluray") return "blu-ray";
  return value;
}

export function getProductFormats(product: Product) {
  const searchCorpus = [
    product.title,
    product.description,
    ...(product.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return FORMAT_KEYWORDS.filter((keyword) => searchCorpus.includes(keyword)).map(
    normalizeFormatLabel,
  );
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
