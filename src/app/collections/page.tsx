import type { Metadata } from "next";
import Link from "next/link";
import { ProductBackButton } from "@/components/product-back-button";
import { getProductTags } from "@/lib/product-metadata";
import { getProducts } from "@/lib/shopify";
import type { Product } from "@/lib/shopify/types";
import { formatTagDisplay, getNormalizedTagKey } from "@/lib/tag-format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Collections",
  alternates: {
    canonical: "/collections",
  },
};

const COLLECTION_TAG_GROUPS: Array<{ title: string; tags: string[] }> = [
  {
    title: "Genre",
    tags: [
      "Horror",
      "Comedy",
      "Crime",
      "Thriller",
      "Action",
      "Mystery",
      "Sci-Fi",
      "Suspense",
      "Suspence",
      "Adventure",
      "Drama",
      "Fantasy",
      "Kids",
      "Romance",
      "Family",
      "Martial Arts",
      "Non-Fiction",
      "Animation",
      "Classic",
      "Music",
      "War",
      "Western",
      "Documentary",
      "Teen",
      "True Crime",
    ],
  },
  {
    title: "Personalities",
    tags: [
      "Alfred Hitchcock",
      "John Carpenter",
      "George Romero",
      "Jerry Goldsmith",
      "Lucio Fulci",
      "Elvira",
      "Dracula",
      "Charles Band",
      "Dario Argento",
      "Hanna-Barbera",
      "H.P. Lovecraft",
      "Gaspar Noé",
      "Lamberto Bava",
      "Wong Kar-Wai",
      "Frankenstein",
      "Sherlock Holmes",
      "Sonny Chiba",
      "Todd McFarlane",
      "R.L. Stine",
      "Ripley's Believe it or Not",
      "Jason Vorhees",
      "Bruce Lee",
      "David Cronenberg",
      "Shaw Bros",
    ],
  },
  {
    title: "Format",
    tags: [
      "Paperback",
      "Pocket Book",
      "Movie Novelization",
      "Multi-Pack",
      "Audiobook",
      "Soundtrack",
      "Short Stories",
      "Digital",
      "Steelbook",
      "Ultraviolet",
      "Boxset",
      "Screener",
    ],
  },
  {
    title: "Publisher",
    tags: [
      "Playboy Press",
      "Dover",
      "Scholastic",
      "Bantam",
      "Ace",
      "TOR",
      "Avon",
      "Pinnacle",
      "Pocket Book",
      "Baronet Books",
      "Del Rey",
      "Leisure",
      "HarperTrophy",
      "Signet",
      "Aerie",
      "Archway",
      "Zebra Books",
    ],
  },
  {
    title: "Region",
    tags: ["Indonesian", "Italian", "Ozploitation", "French", "Chinese", "Japanese"],
  },
  {
    title: "Series",
    tags: ["Mad Max", "Godzilla", "Scooby-Doo", "Friday the 13th", "TMNT"],
  },
  {
    title: "Studio",
    tags: [
      "Columbia Pictures",
      "Universal",
      "Varèse Sarabande Records",
      "Anchor Bay",
      "MGM",
      "Mill Creek Entertainment",
      "MCA Home Video",
      "RLJE Films",
      "Legendary Pictures",
      "Warner Bros.",
      "Vidmark Entertainment",
      "Entertainment One Film",
      "IFC Films",
      "HBO",
      "Miramax",
      "Paramount",
      "Lionsgate",
      "Artisan Entertainment",
      "Diamond Entertainment",
      "New Line Cinema",
      "New Horizons Home Video",
      "Echo Bridge",
      "Columbia Music Video",
      "Genius Productions Inc.",
      "New Concorde",
      "Platinum Disc Corporation",
      "Vintage Home Entertainment",
      "Madacy Entertainment",
      "Saturn Productions",
      "Screen Gems",
      "Screen Media Films",
      "Videoasia",
    ],
  },
  {
    title: "Label",
    tags: [
      "Shout! Factory",
      "Scream Factory",
      "Blue Underground",
      "Mondo Macabro",
      "Criterion",
      "Full Moon Features",
      "Scorpion",
      "Severin",
      "Code Red",
      "Kino Lorber",
      "Cult Films",
      "Synapse Films",
      "SRS Cinema",
      "Tokyo Shock",
      "Vestron",
    ],
  },
  {
    title: "Media",
    tags: ["CD", "VHS", "DVD", "Blu-ray", "Cassette", "Book", "CED", "LaserDisc", "Vinyl", "Magazine", "Videodisc"],
  },
  {
    title: "Theme",
    tags: [
      "Slasher",
      "Vampires",
      "Zombies",
      "Giallo",
      "Gore",
      "Clowns",
      "Bizarre",
      "Post-Apocalyptic",
      "Ghosts",
      "Sharks",
      "Aliens",
      "Cosmic Horror",
      "Comic Adaptation",
      "Goth Classic",
      "Supernatural",
      "Bigfoot",
      "Arthouse",
      "Drugs",
      "Surreal",
      "Outer Space",
      "Bugs",
      "Fish People",
      "Mummies",
      "Werewolves",
      "Witches",
      "Blaxploitation",
      "Creepy Kids",
      "Demons",
      "Exploitation",
      "Kaiju",
      "Freaky Little Guys",
      "Psychic Powers",
      "Rock",
      "Robots",
      "Body Horror",
      "Cults",
      "Ninjas",
      "Voodoo",
    ],
  },
  {
    title: "Era",
    tags: [
      "'50s Books",
      "'60s Books",
      "2000s Films",
      "2010s Films",
      "2000s Books",
      "'00s Films",
      "'60s Films",
      "'70s Films",
      "'80s Films",
      "'90s Films",
      "'90s Books",
      "'80s Books",
      "'70s Books",
      "1900s Books",
    ],
  },
];

function getSectionId(title: string) {
  return `collection-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

function hashTag(tag: string) {
  let hash = 0;
  for (let index = 0; index < tag.length; index += 1) {
    hash = (hash * 31 + tag.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function buildStickerColorSequence(tags: string[]) {
  const palette = [
    "vhs-sticker-acid",
    "vhs-sticker-cream",
    "vhs-sticker-pink",
    "vhs-sticker-orange",
    "vhs-sticker-red",
    "border-sky-300/85 bg-sky-300 !text-black",
  ];

  // Shuffle each visual row deterministically so rows don't repeat the same pattern.
  const rowSize = palette.length;
  const baseSeed = hashTag(tags.join("|")) || 1;
  const sequence: string[] = [];
  let previousRowSignature = "";

  for (let rowStart = 0; rowStart < tags.length; rowStart += rowSize) {
    const shuffled = [...palette];
    let state = (baseSeed ^ rowStart) || 1;

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const j = state % (i + 1);
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    const rowSignature = shuffled.join("|");
    if (rowSignature === previousRowSignature) {
      shuffled.push(shuffled.shift()!);
    }
    previousRowSignature = shuffled.join("|");

    const rowLength = Math.min(rowSize, tags.length - rowStart);
    for (let offset = 0; offset < rowLength; offset += 1) {
      sequence.push(shuffled[offset]);
    }
  }

  return sequence;
}

function getStickerTextClass(tag: string) {
  const normalized = getNormalizedTagKey(tag);

  if (normalized === getNormalizedTagKey("Mill Creek Entertainment")) {
    return "text-[10px] tracking-[0.05em] sm:text-[11px]";
  }

  if (normalized === getNormalizedTagKey("Ozploitation")) {
    return "text-[11px] tracking-[0.06em] sm:text-[12px]";
  }

  if (normalized === getNormalizedTagKey("Supernatural")) {
    return "text-[9px] tracking-[0.02em] sm:text-[10px]";
  }

  if (normalized === getNormalizedTagKey("Vidmark Entertainment")) {
    return "text-[8px] tracking-[0.01em] sm:text-[9px]";
  }

  if (normalized === getNormalizedTagKey("Entertainment One Film")) {
    return "text-[8px] tracking-[0.01em] sm:text-[9px]";
  }

  if (normalized === getNormalizedTagKey("Artisan Entertainment")) {
    return "text-[8px] tracking-[0.01em] sm:text-[9px]";
  }

  if (normalized === getNormalizedTagKey("Diamond Entertainment")) {
    return "text-[8px] tracking-[0.01em] sm:text-[9px]";
  }

  if (normalized === getNormalizedTagKey("Frankenstein")) {
    return "text-[10px] tracking-[0.04em] sm:text-[11px]";
  }

  if (normalized === getNormalizedTagKey("Blaxploitation")) {
    return "text-[10px] tracking-[0.03em] sm:text-[11px]";
  }

  if (normalized === getNormalizedTagKey("Exploitation")) {
    return "text-[10px] tracking-[0.04em] sm:text-[11px]";
  }

  if (normalized === getNormalizedTagKey("HarperTrophy")) {
    return "text-[11px] tracking-[0.07em] sm:text-[12px]";
  }

  if (normalized === getNormalizedTagKey("Vintage Home Entertainment")) {
    return "text-[8px] tracking-[0.01em] sm:text-[9px]";
  }

  if (normalized === getNormalizedTagKey("Madacy Entertainment")) {
    return "text-[7px] tracking-[0.01em] sm:text-[8px]";
  }

  if (normalized === getNormalizedTagKey("Movie Novelization")) {
    return "text-[11px] tracking-[0.07em] sm:text-[12px]";
  }

  return "text-[12px] tracking-[0.08em] sm:text-[13px]";
}

export default async function CollectionsPage() {
  let products: Product[] = [];
  let shopifyReady = true;
  let shopifyError = "";

  try {
    products = await getProducts();
  } catch (error) {
    shopifyReady = false;
    shopifyError = error instanceof Error ? error.message : "Unknown Shopify error.";
  }
  const allTags = new Set<string>();

  for (const product of products) {
    for (const tag of getProductTags(product)) {
      allTags.add(tag);
    }
  }

  const rawTags = Array.from(allTags).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  const tagByKey = new Map<string, string>();

  for (const tag of rawTags) {
    const key = getNormalizedTagKey(tag);
    if (!tagByKey.has(key)) {
      tagByKey.set(key, tag);
    }
  }

  const tags = Array.from(tagByKey.values()).sort((a, b) =>
    formatTagDisplay(a).localeCompare(formatTagDisplay(b), undefined, {
      sensitivity: "base",
    }),
  );

  const usedKeys = new Set<string>();

  const groupedSections = COLLECTION_TAG_GROUPS.map((group) => {
    const groupTags = group.tags
      .map((requestedTag) => {
        const key = getNormalizedTagKey(requestedTag);
        const matched = tagByKey.get(key);
        if (!matched) {
          return null;
        }
        usedKeys.add(key);
        return matched;
      })
      .filter((tag): tag is string => Boolean(tag));

    groupTags.sort((a, b) =>
      formatTagDisplay(a).localeCompare(formatTagDisplay(b), undefined, {
        sensitivity: "base",
      }),
    );

    return {
      title: group.title,
      tags: groupTags,
    };
  })
    .filter((group) => group.tags.length > 0)
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

  const otherTags = tags
    .filter((tag) => !usedKeys.has(getNormalizedTagKey(tag)))
    .sort((a, b) =>
      formatTagDisplay(a).localeCompare(formatTagDisplay(b), undefined, {
        sensitivity: "base",
      }),
    );

  const jumpSections = [
    ...groupedSections.map((group) => ({
      title: group.title,
      id: getSectionId(group.title),
    })),
    ...(otherTags.length > 0 ? [{ title: "Other Tags", id: getSectionId("Other Tags") }] : []),
  ];

  const stickerTilts = ["vhs-sticker-tilt-left", "", "vhs-sticker-tilt-right"];

  return (
    <section className="relative pb-8">
      <div className="mb-3 md:hidden">
        <ProductBackButton />
      </div>
      <div className="absolute -left-24 top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <ProductBackButton />
      </div>

      <header className="noise-panel rounded-lg p-5 sm:p-7">
        <p className="text-sm uppercase tracking-[0.24em] text-lime-300/95">Browse by tags</p>
        <h1 className="tomb-title mt-2 text-5xl leading-[0.9] sm:text-6xl">SHOP COLLECTIONS</h1>
        <p className="tomb-subtle mt-3 max-w-2xl text-sm sm:text-base">
          Jump straight into exact themes, formats, and franchises.
        </p>
      </header>

      <div className="mt-6">
        {!shopifyReady ? (
          <section className="mb-6 rounded-md border border-red-400/40 bg-red-950/20 px-4 py-3 text-sm text-red-100">
            Shopify data is offline. {shopifyError || "Check your Shopify setup and retry."}
          </section>
        ) : null}

        {tags.length === 0 ? (
          <div className="rounded-lg border border-white/15 bg-black/45 p-6 text-sm text-zinc-300">
            No tags found yet. Add a tags line in product descriptions to build this view.
          </div>
        ) : (
          <div className="space-y-6">
            <nav className="noise-panel rounded-lg p-4 sm:p-5" aria-label="Jump to collection section">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-zinc-400">Quick jump</p>
              <div className="flex flex-wrap gap-2">
                {jumpSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="vhs-sticker-btn vhs-sticker-cream px-3 py-1.5 text-[10px] sm:text-[11px]"
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </nav>

            {groupedSections.map((group) => (
              <section id={getSectionId(group.title)} key={group.title} className="noise-panel relative scroll-mt-28 rounded-lg p-4 pl-16 sm:p-5 sm:pl-24">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center sm:w-16">
                  <h2 className="tomb-title -rotate-90 whitespace-nowrap text-[18px] italic tracking-[0.22em] text-sky-200/95 sm:text-[30px]">
                    {group.title}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {(() => {
                    const colorSequence = buildStickerColorSequence(group.tags);

                    return group.tags.map((tag, index) => {
                      const hash = hashTag(tag);
                      const color = colorSequence[index];
                      const tilt = stickerTilts[(hash >>> 3) % stickerTilts.length];
                      const compactTextClass = getStickerTextClass(tag);

                      return (
                        <Link
                          key={`${group.title}-${tag}`}
                          href={`/tags/${encodeURIComponent(tag)}`}
                          className={`vhs-sticker-btn h-[4.5rem] w-full max-w-[9rem] justify-center self-center justify-self-center px-3 py-2 text-center font-black leading-[1.05] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:h-28 sm:w-28 sm:max-w-none sm:px-2 ${compactTextClass} ${color} ${tilt}`}
                        >
                          {formatTagDisplay(tag)}
                        </Link>
                      );
                    });
                  })()}
                </div>
              </section>
            ))}

            {otherTags.length > 0 ? (
              <section id={getSectionId("Other Tags")} className="noise-panel relative scroll-mt-28 rounded-lg p-4 pl-16 sm:p-5 sm:pl-24">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center sm:w-16">
                  <h2 className="tomb-title -rotate-90 whitespace-nowrap text-[18px] italic tracking-[0.22em] text-sky-200/95 sm:text-[30px]">
                    Other Tags
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {(() => {
                    const colorSequence = buildStickerColorSequence(otherTags);

                    return otherTags.map((tag, index) => {
                      const hash = hashTag(tag);
                      const color = colorSequence[index];
                      const tilt = stickerTilts[(hash >>> 3) % stickerTilts.length];
                      const compactTextClass = getStickerTextClass(tag);

                      return (
                        <Link
                          key={`other-${tag}`}
                          href={`/tags/${encodeURIComponent(tag)}`}
                          className={`vhs-sticker-btn h-[4.5rem] w-full max-w-[9rem] justify-center self-center justify-self-center px-3 py-2 text-center font-black leading-[1.05] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:h-28 sm:w-28 sm:max-w-none sm:px-2 ${compactTextClass} ${color} ${tilt}`}
                        >
                          {formatTagDisplay(tag)}
                        </Link>
                      );
                    });
                  })()}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
