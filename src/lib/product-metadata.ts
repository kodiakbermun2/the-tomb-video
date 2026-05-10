import { Product } from "@/lib/shopify/types";

type ParsedProductDescription = {
  mediaType: string;
  studio: string;
  genres: string[];
  isFeatured: boolean;
  isRare: boolean;
  isOutOfPrint: boolean;
  rarityLabel: "Rare" | "Out of print" | null;
  ownershipLine: string;
  conditionLine: string;
  regionCode: string;
  detailsText: string;
  tags: string[];
  letterboxdUrls: string[];
};

function normalizeTagKey(value: string) {
  return normalizeWhitespace(value)
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[.,;:!?]+$/g, "")
    .toLowerCase();
}

function canonicalizeTagDisplay(value: string) {
  const normalized = normalizeTagKey(value);

  if (normalized === "warner bros") {
    return "Warner Bros.";
  }

  if (normalized === "columbia") {
    return "Columbia Pictures";
  }

  if (normalized === "pocketbook") {
    return "Pocket Book";
  }

  return value;
}

function splitTagLine(raw: string) {
  return raw
    .split(/[,|;/]/g)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeWhitespace(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDescriptionLines(product: Product) {
  const plainLines = (product.description || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const htmlLines = (product.descriptionHtml || "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Shopify may provide a flattened one-line `description` while `descriptionHtml`
  // still preserves line boundaries needed for metadata parsing.
  if (htmlLines.length > plainLines.length) {
    return htmlLines;
  }

  if (plainLines.length > 0) {
    return plainLines;
  }

  return htmlLines;
}

function expandInlineMarkers(lines: string[]) {
  if (lines.length !== 1) {
    return lines;
  }

  return lines[0]
    .replace(/\s+(Condition:|Tags?:|Note:|Region(?:\s*Code)?\s*:)/gi, "\n$1")
    // Split ownership markers only when they are actual metadata markers, not words
    // inside studio names like "New Horizons".
    .replace(/\s+(PRE[- ]?OWNED|USED)\b/gi, "\n$1")
    .replace(
      /\s+NEW(?=\s+(?:CONDITION\s*:|TAGS?\s*:|NOTE\s*:|REGION(?:\s*CODE)?\s*[:\-]|https?:\/\/|#)|\s*$)/gi,
      "\nNEW",
    )
    .replace(/\s+(https?:\/\/)/gi, "\n$1")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getDescriptionLines(product: Product) {
  return expandInlineMarkers(normalizeDescriptionLines(product));
}

function splitConditionParts(rawConditionValue: string) {
  const normalized = normalizeWhitespace(rawConditionValue);
  if (!normalized) {
    return { conditionValue: "", remainder: "" };
  }

  const knownRatings = [
    "well-read",
    "well read",
    "brand new",
    "like new",
    "very good",
    "good",
    "fair",
    "acceptable",
    "poor",
    "new",
    "used",
  ];

  const lower = normalized.toLowerCase();
  for (const rating of knownRatings) {
    if (lower === rating) {
      return { conditionValue: normalized, remainder: "" };
    }

    if (lower.startsWith(`${rating} `)) {
      const conditionValue = normalized.slice(0, rating.length).trim();
      const remainder = normalized.slice(rating.length).trim();
      return { conditionValue, remainder };
    }
  }

  return { conditionValue: normalized, remainder: "" };
}

function sanitizeRegionValue(rawRegionValue: string) {
  const withoutUrls = rawRegionValue.replace(/https?:\/\/\S+/gi, " ");
  const beforeHashtags = withoutUrls.split(/\s+#/)[0] ?? withoutUrls;
  const beforeMetadataLabels = beforeHashtags.split(/\s+(?:tags?|condition|note)\s*:/i)[0] ?? beforeHashtags;
  return normalizeWhitespace(beforeMetadataLabels).replace(/[.,;:!?]+$/g, "");
}

function parseHeaderLine(line: string): {
  mediaType: string;
  studio: string;
  genres: string[];
  isFeatured: boolean;
  isOutOfPrint: boolean;
  isRare: boolean;
  rarityLabel: "Rare" | "Out of print" | null;
} | null {
  const parts = line
    .split(/\s*\/\s*/)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);

  // Require at least media type / distributor / genre(s).
  if (parts.length < 3) {
    return null;
  }

  const markerLine = normalizeTagKey(parts.slice(3).join(" / "));

  return {
    mediaType: parts[0] || "",
    studio: parts[1] || "",
    genres: (parts[2] || "")
      .split(",")
      .map((genre) => normalizeWhitespace(genre))
      .filter(Boolean),
    isFeatured: /\bfeatured\b/i.test(markerLine),
    isOutOfPrint: /\boop\b/i.test(markerLine),
    isRare: /\boop\b/i.test(markerLine) || /\brare\b/i.test(markerLine),
    rarityLabel: /\boop\b/i.test(markerLine)
      ? "Out of print"
      : /\brare\b/i.test(markerLine)
        ? "Rare"
        : null,
  };
}

export function parseProductDescription(product: Product): ParsedProductDescription {
  const lines = getDescriptionLines(product);
  const ownershipSourceLine = normalizeWhitespace(lines[1] || "");
  const nonTagLines: string[] = [];
  const tags: string[] = [];
  const letterboxdUrls: string[] = [];
  let mediaType = "";
  let studio = "";
  let genres: string[] = [];
  let isFeatured = false;
  let isRare = false;
  let isOutOfPrint = false;
  let rarityLabel: "Rare" | "Out of print" | null = null;
  let ownershipLine = "";
  let conditionLine = "";
  let regionCode = "";

  const headerLine = lines[0] ? normalizeWhitespace(lines[0]) : "";
  const parsedHeader = headerLine ? parseHeaderLine(headerLine) : null;

  if (parsedHeader) {
    mediaType = parsedHeader.mediaType;
    studio = parsedHeader.studio;
    genres = parsedHeader.genres;
    isFeatured = parsedHeader.isFeatured;
    isRare = parsedHeader.isRare;
    isOutOfPrint = parsedHeader.isOutOfPrint;
    rarityLabel = parsedHeader.rarityLabel;
  }

  if (/^(PRE-OWNED|NEW|USED)\b/i.test(ownershipSourceLine)) {
    ownershipLine = ownershipSourceLine;
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];

    if (lineIndex === 0 && parsedHeader) {
      continue;
    }

    const foundUrls = line.match(/https?:\/\/[^\s)]+/gi) ?? [];
    let scrubbedLine = normalizeWhitespace(line);

    for (const rawUrl of foundUrls) {
      const cleanedUrl = rawUrl
        .replace(/[.,;:!?]+$/, "")
        .replace(/#[A-Za-z0-9_-]+$/, "");
      if (/letterboxd\.com/i.test(cleanedUrl)) {
        letterboxdUrls.push(cleanedUrl);
        scrubbedLine = scrubbedLine.replace(rawUrl, "").trim();
      }
    }

    const hashTags = Array.from(scrubbedLine.matchAll(/#([^#]+)/g)).map((match) =>
      normalizeWhitespace(match[1]).replace(/[.,;:!?]+$/, ""),
    );
    if (hashTags.length > 0) {
      tags.push(...hashTags);
      scrubbedLine = normalizeWhitespace(scrubbedLine.replace(/#([^#]+)/g, ""));
    }

    if (!scrubbedLine) {
      continue;
    }

    if (/^(PRE[- ]?OWNED|USED|NEW)\b/i.test(scrubbedLine)) {
      continue;
    }

    const tagMatch = scrubbedLine.match(/^tags?\s*:\s*(.+)$/i);
    if (tagMatch) {
      tags.push(...splitTagLine(tagMatch[1]));
      continue;
    }

    if (!conditionLine && /^condition\s*:/i.test(scrubbedLine)) {
      const rawConditionValue = scrubbedLine.replace(/^condition\s*:/i, "").trim();
      const { conditionValue, remainder } = splitConditionParts(rawConditionValue);

      conditionLine = conditionValue
        ? `Condition: ${conditionValue}`
        : "Condition:";

      if (remainder) {
        nonTagLines.push(remainder);
      }

      continue;
    }

    const regionCodeMatch = scrubbedLine.match(/^region(?:\s*code)?\s*[:\-]\s*(.+)$/i);
    if (!regionCode && regionCodeMatch) {
      regionCode = sanitizeRegionValue(regionCodeMatch[1]);
      continue;
    }

    if (/^note\s*:/i.test(scrubbedLine)) {
      scrubbedLine = scrubbedLine.replace(/^note\s*:/i, "").trim();
      if (!scrubbedLine) {
        continue;
      }
    }

    nonTagLines.push(scrubbedLine);
  }

  const uniqueTags = Array.from(new Set(tags));
  const uniqueLetterboxdUrls = Array.from(new Set(letterboxdUrls));
  if (!conditionLine && nonTagLines.length > 0) {
    conditionLine = nonTagLines.shift() || "";
  }
  const detailsText = nonTagLines.join("\n");

  return {
    mediaType,
    studio,
    genres,
    isFeatured,
    isRare,
    isOutOfPrint,
    rarityLabel,
    ownershipLine,
    conditionLine,
    regionCode,
    detailsText,
    tags: uniqueTags,
    letterboxdUrls: uniqueLetterboxdUrls,
  };
}

export function getProductTags(product: Product) {
  const parsed = parseProductDescription(product);
  const merged = [
    ...(product.tags ?? []),
    ...parsed.tags,
    parsed.mediaType,
    parsed.studio,
    ...parsed.genres,
  ];
  const unique = new Map<string, string>();

  for (const tag of merged) {
    const normalized = canonicalizeTagDisplay(tag.trim());
    if (!normalized) continue;

    const key = normalizeTagKey(normalized);
    if (!unique.has(key)) {
      unique.set(key, normalized);
    }
  }

  return Array.from(unique.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function getGenreTags(product: Product) {
  const mediaHints = ["vhs", "blu-ray", "bluray", "dvd", "4k", "laserdisc", "vinyl", "cassette"];
  const studio = (product.vendor || "").toLowerCase();

  return getProductTags(product).filter((tag) => {
    const lower = tag.toLowerCase();
    if (studio && lower === studio) return false;
    if (mediaHints.some((hint) => lower.includes(hint))) return false;
    return true;
  });
}

export function hasExactTag(product: Product, requestedTag: string) {
  const normalizedRequestedTag = normalizeTagKey(requestedTag);
  if (!normalizedRequestedTag) return false;

  return getProductTags(product).some(
    (tag) => normalizeTagKey(tag) === normalizedRequestedTag,
  );
}

export function isOutOfPrint(product: Product) {
  return parseProductDescription(product).isOutOfPrint;
}

export function isRareItem(product: Product) {
  return parseProductDescription(product).isRare;
}

export function isStaffPickItem(product: Product) {
  return parseProductDescription(product).isFeatured;
}

export function getRarityLabel(product: Product) {
  return parseProductDescription(product).rarityLabel;
}

export function getOwnershipBadge(product: Product): "NEW" | "USED" | null {
  const parsed = parseProductDescription(product);
  const ownership = parsed.ownershipLine.trim().toLowerCase();

  if (ownership.startsWith("new")) {
    return "NEW";
  }

  if (ownership.startsWith("used") || ownership.startsWith("pre-owned")) {
    return "USED";
  }

  return null;
}
