const ALWAYS_UPPER_TAGS = new Set(["dvd", "cd", "vhs"]);
const ACRONYM_SEGMENTS = new Set(["ifc", "mgm", "mca", "rlje", "tor"]);
const DISPLAY_OVERRIDES = new Map<string, string>([
  ["ifc films", "IFC Films"],
  ["mgm", "MGM"],
  ["mca home video", "MCA Home Video"],
  ["rlje films", "RLJE Films"],
  ["hanna-barbera", "Hanna-Barbera"],
  ["scooby-doo", "Scooby-Doo"],
]);

function normalizeTagKey(value: string) {
  return value
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[.,;:!?]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function getNormalizedTagKey(value: string) {
  return normalizeTagKey(value);
}

export function formatTagDisplay(tag: string) {
  const clean = tag.trim().replace(/\s+/g, " ");
  if (!clean) return clean;

  const normalizedTag = normalizeTagKey(clean);
  const displayOverride = DISPLAY_OVERRIDES.get(normalizedTag);
  if (displayOverride) {
    return displayOverride;
  }

  if (normalizedTag === "warner bros") {
    return "Warner Bros.";
  }

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

      if (ACRONYM_SEGMENTS.has(normalized)) {
        return normalized.toUpperCase();
      }

      if (segment.includes("-")) {
        return segment
          .split("-")
          .map((piece) => {
            if (!piece) return piece;
            const firstLetterIndex = piece.search(/[A-Za-z]/);
            if (firstLetterIndex === -1) {
              return piece;
            }

            const prefix = piece.slice(0, firstLetterIndex);
            const body = piece.slice(firstLetterIndex);
            return `${prefix}${body.charAt(0).toUpperCase()}${body.slice(1).toLowerCase()}`;
          })
          .join("-");
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
