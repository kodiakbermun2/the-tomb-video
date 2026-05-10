import { getDescriptionLines, parseProductDescription } from "@/lib/product-metadata";
import { Product } from "@/lib/shopify/types";

export type ProductMetadataValidation = {
  lines: string[];
  isHeaderValid: boolean;
  isOwnershipLineValid: boolean;
  isConditionLineValid: boolean;
  warnings: string[];
};

const OWNERSHIP_PATTERN = /^(PRE[- ]?OWNED|NEW|USED)\b/i;

function hasStructuredHeader(line: string) {
  const parts = line
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length >= 3;
}

export function validateProductMetadata(product: Product): ProductMetadataValidation {
  const lines = getDescriptionLines(product);
  const warnings: string[] = [];

  const line1 = lines[0]?.trim() || "";
  const line2 = lines[1]?.trim() || "";
  const line3 = lines[2]?.trim() || "";

  const isHeaderValid = Boolean(line1 && hasStructuredHeader(line1));
  const isOwnershipLineValid = Boolean(line2 && OWNERSHIP_PATTERN.test(line2));
  const isConditionLineValid = Boolean(line3 && /^condition\s*:/i.test(line3));

  if (!isHeaderValid) {
    warnings.push("Line 1 should be: Media / Studio / Genre(s).");
  }
  if (!isOwnershipLineValid) {
    warnings.push("Line 2 should be exactly NEW, USED, or PRE-OWNED.");
  }
  if (!isConditionLineValid) {
    warnings.push("Line 3 should start with Condition: <rating>.");
  }

  if (/\bnew\b/i.test(line1) && /^pre[- ]?owned\b/i.test(line2)) {
    warnings.push("Header includes 'New' text. Verify ownership is still PRE-OWNED.");
  }

  const parsed = parseProductDescription(product);
  if (!parsed.ownershipLine) {
    warnings.push("Ownership is not currently parsed from description metadata.");
  }

  return {
    lines,
    isHeaderValid,
    isOwnershipLineValid,
    isConditionLineValid,
    warnings,
  };
}
