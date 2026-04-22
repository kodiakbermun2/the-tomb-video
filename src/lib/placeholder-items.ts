export type PlaceholderSaleItem = {
  id: string;
  title: string;
  format: string;
  era: string;
  condition: string;
  price: string;
  salePrice?: string;
  tagline: string;
  badge?: "sale" | "new" | "rare";
};

export const placeholderSaleItems: PlaceholderSaleItem[] = [
  {
    id: "sale-vhs-001",
    title: "Neon Sewer Slasher",
    format: "VHS",
    era: "1987",
    condition: "Beat box, plays clean",
    price: "$24.00",
    salePrice: "$14.00",
    tagline: "Gym blood, mall synth, pure sleaze.",
    badge: "sale",
  },
  {
    id: "sale-ld-001",
    title: "Astro Graveyard",
    format: "LaserDisc",
    era: "1993",
    condition: "Sleeve wear, disc nice",
    price: "$45.00",
    tagline: "Space junk opera with six endings.",
    badge: "rare",
  },
  {
    id: "sale-br-001",
    title: "Toxic Boardwalk Double Feature",
    format: "Blu-ray",
    era: "2022 remaster",
    condition: "Near mint",
    price: "$28.00",
    salePrice: "$18.00",
    tagline: "Two trash classics in one loud slab.",
    badge: "sale",
  },
  {
    id: "sale-4k-001",
    title: "Chrome Cannibal",
    format: "4K UHD",
    era: "1984",
    condition: "Slipcover scuffed",
    price: "$39.00",
    tagline: "Body horror polished till it screams.",
    badge: "new",
  },
  {
    id: "sale-vinyl-001",
    title: "Night Shift Necro Synth OST",
    format: "Vinyl",
    era: "New pressing",
    condition: "Sealed",
    price: "$36.00",
    salePrice: "$22.00",
    tagline: "Fog machine music for bad choices.",
    badge: "sale",
  },
  {
    id: "sale-cass-001",
    title: "Parking Lot Possession Mixtape",
    format: "Cassette",
    era: "2025 dub",
    condition: "Hand-labeled shell",
    price: "$16.00",
    tagline: "Warped hiss and trunk-rattle rituals.",
    badge: "new",
  },
  {
    id: "sale-book-001",
    title: "Bottom Shelf Manifesto Zine",
    format: "Book / Zine",
    era: "Issue #1",
    condition: "Riso print rough edges",
    price: "$18.00",
    tagline: "Unfiltered notes from the filth pit.",
    badge: "rare",
  },
  {
    id: "sale-memo-001",
    title: "Lobby Card + Sticker Grave Bag",
    format: "Memorabilia",
    era: "Mixed lot",
    condition: "As-is chaos",
    price: "$32.00",
    salePrice: "$19.00",
    tagline: "Ephemera for people with no shelf discipline.",
    badge: "sale",
  },
];
