export type ProductStickerKind = "new" | "rare" | "staffPick";

type ResolveProductStickerSlotsArgs = {
  isRare: boolean;
  isStaffPick: boolean;
  ownershipBadge: "NEW" | "USED" | null;
};

export function resolveProductStickerSlots({
  isRare,
  isStaffPick,
  ownershipBadge,
}: ResolveProductStickerSlotsArgs): {
  rightSticker: ProductStickerKind | null;
  leftSticker: ProductStickerKind | null;
} {
  const available = new Set<ProductStickerKind>();

  if (ownershipBadge === "NEW") {
    available.add("new");
  }
  if (isRare) {
    available.add("rare");
  }
  if (isStaffPick) {
    available.add("staffPick");
  }

  const rightSticker = available.has("new")
    ? "new"
    : available.has("rare")
      ? "rare"
      : available.has("staffPick")
        ? "staffPick"
        : null;

  if (!rightSticker) {
    return { rightSticker: null, leftSticker: null };
  }

  const leftPriority: ProductStickerKind[] =
    rightSticker === "new"
      ? ["staffPick", "rare"]
      : rightSticker === "rare"
        ? ["staffPick"]
        : ["rare"];

  const leftSticker = leftPriority.find((candidate) => available.has(candidate)) ?? null;

  return { rightSticker, leftSticker };
}
