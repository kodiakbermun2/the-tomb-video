export function getMediaChipClass(mediaType: string) {
  const normalized = mediaType.trim().toLowerCase();

  if (normalized.includes("ced") || normalized.includes("capacitance electronic disc")) {
    return "border-cyan-300/85 bg-cyan-200 !text-black";
  }

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

  if (normalized.includes("cd") || normalized.includes("compact disc")) {
    return "border-zinc-500/85 bg-zinc-400 !text-black";
  }

  if (normalized.includes("laserdisc") || normalized.includes("laser disc")) {
    return "border-orange-300/85 bg-orange-200 !text-black";
  }

  if (normalized.includes("vinyl") || normalized.includes("lp")) {
    return "border-fuchsia-300/85 bg-fuchsia-200 !text-black";
  }

  if (normalized.includes("cassette")) {
    return "border-violet-400/90 bg-violet-300 !text-black";
  }

  if (normalized.includes("book")) {
    return "border-amber-300/90 bg-amber-300 !text-black";
  }

  if (normalized.includes("magazine") || normalized.includes("zine")) {
    return "border-emerald-300/85 bg-emerald-200 !text-black";
  }

  return "";
}
