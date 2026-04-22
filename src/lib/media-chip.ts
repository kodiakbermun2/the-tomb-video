export function getMediaChipClass(mediaType: string) {
  const normalized = mediaType.trim().toLowerCase();

  if (normalized.includes("vhs")) {
    return "border-lime-300/85 bg-lime-300 !text-black";
  }

  if (normalized.includes("dvd")) {
    return "border-white/85 bg-white !text-black";
  }

  if (normalized.includes("blu-ray") || normalized.includes("bluray")) {
    return "border-sky-300/85 bg-sky-300 !text-black";
  }

  if (normalized.includes("4k")) {
    return "border-white/35 bg-black !text-zinc-100";
  }

  return "";
}
