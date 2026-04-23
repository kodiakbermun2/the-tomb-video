const ALWAYS_UPPER_TAGS = new Set(["dvd", "cd", "vhs"]);

function normalizeTagKey(value: string) {
  return value
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function getNormalizedTagKey(value: string) {
  return normalizeTagKey(value);
}

export function formatTagDisplay(tag: string) {
  const clean = tag.trim().replace(/\s+/g, " ");
  if (!clean) return clean;

  return clean
    .split(" ")
    .map((segment) => {
      const normalized = normalizeTagKey(segment);

      if (ALWAYS_UPPER_TAGS.has(normalized)) {
        return normalized.toUpperCase();
      }

      if (normalized === "blu-ray" || normalized === "bluray") {
        return "Blu-ray";
      }

      const firstLetterIndex = segment.search(/[A-Za-z]/);
      if (firstLetterIndex === -1) {
        return segment;
      }

      const prefix = segment.slice(0, firstLetterIndex);
      const body = segment.slice(firstLetterIndex);

      return `${prefix}${body.charAt(0).toUpperCase()}${body.slice(1).toLowerCase()}`;
    })
    .join(" ");
}
