import type { Metadata } from "next";
import Link from "next/link";
import { ProductBackButton } from "@/components/product-back-button";
import { getProductTags } from "@/lib/product-metadata";
import { getProducts } from "@/lib/shopify";
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
    tags: ["Horror", "Comedy", "Crime", "Thriller", "Action", "Mystery", "Sci-Fi", "Suspense"],
  },
  {
    title: "Personalities",
    tags: ["Alfred Hitchcock", "George Romero", "Jerry Goldsmith", "Lucio Fulci", "Elvira", "Dracula"],
  },
  {
    title: "Publisher",
    tags: ["Playboy Press"],
  },
  {
    title: "Region",
    tags: ["Indonesian", "Italian", "Ozploitation"],
  },
  {
    title: "Series",
    tags: ["Mad Max"],
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
      "Playboy Press",
    ],
  },
  {
    title: "Label",
    tags: ["Shout! Factory", "Scream Factory", "Blue Underground", "Mondo Macabro"],
  },
  {
    title: "Media",
    tags: ["CD", "VHS", "DVD", "Blu-ray", "Book"],
  },
  {
    title: "Theme",
    tags: ["Slasher", "Vampires", "Zombies", "Giallo", "Gore", "Clowns", "Bizarre", "Post-Apocalyptic"],
  },
  {
    title: "Era",
    tags: ["'00s Films", "'60s Films", "'70s Films", "'80s Films", "'90s Films", "'70s Books"],
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

  // Shuffle once per section (deterministically) and then cycle colors.
  // With up to 6 columns, this prevents heavy same-color clustering in any row.
  const seed = hashTag(tags.join("|"));
  const shuffled = [...palette];
  let state = seed || 1;

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  return tags.map((_, index) => shuffled[index % shuffled.length]);
}

function getStickerTextClass(tag: string) {
  const normalized = getNormalizedTagKey(tag);

  if (normalized === getNormalizedTagKey("Mill Creek Entertainment")) {
    return "text-[10px] tracking-[0.05em] sm:text-[11px]";
  }

  if (normalized === getNormalizedTagKey("Ozploitation")) {
    return "text-[11px] tracking-[0.06em] sm:text-[12px]";
  }

  return "text-[12px] tracking-[0.08em] sm:text-[13px]";
}

export default async function CollectionsPage() {
  const products = await getProducts(80);
  const allTags = new Set<string>();

  for (const product of products) {
    for (const tag of getProductTags(product)) {
      allTags.add(tag);
    }
  }

  const tags = Array.from(allTags).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  const tagByKey = new Map<string, string>();

  for (const tag of tags) {
    const key = getNormalizedTagKey(tag);
    if (!tagByKey.has(key)) {
      tagByKey.set(key, tag);
    }
  }

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
        <p className="text-xs uppercase tracking-[0.24em] text-lime-300/90">Browse by tags</p>
        <h1 className="tomb-title mt-2 text-5xl leading-[0.9] sm:text-6xl">SHOP COLLECTIONS</h1>
        <p className="tomb-subtle mt-3 max-w-2xl text-sm sm:text-base">
          Jump straight into exact themes, formats, and franchises.
        </p>
      </header>

      <div className="mt-6">
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
