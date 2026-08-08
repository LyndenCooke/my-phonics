import { JOURNEY_SUBLEVEL_BY_LEGACY } from "./levels8";

/**
 * Where in the world each LIBRARY book lives — the printed MyPhonicsBooks
 * fleet on the World of Books globe, alongside the family-made books.
 *
 * Countries come from the books' own production records, not guesswork:
 * myphonics_books/data/story_summaries.json culture fields, each story file's
 * "Setting:" line, and PRODUCTION_CHECKLIST.md. Most of the early books are
 * deliberately UK-set (Lynden: "most are from uk especially older books");
 * the later fleet is the open-window-on-the-world strand.
 *
 * `legacySub` is the OLD 6-level id — it keys the cover image
 * (/covers/{n}_{m}_cover.jpg) and converts to the public 8-level journey via
 * JOURNEY_SUBLEVEL_BY_LEGACY. The Jam Jug's souk is deliberately not pinned
 * to a country the story never names.
 */
export interface LibraryWorldBook {
  legacySub: string;      // e.g. "L1.7" (old numbering)
  title: string;
  slug: string;           // /library?book={slug}
  country: string;        // pin label; must match WorldGlobe COUNTRY_COORDS
  flag: string;
  setting: string;        // one-line "where this story lives"
}

export const LIBRARY_WORLD: LibraryWorldBook[] = [
  // ── the UK heart of the early levels ─────────────────────────────
  { legacySub: "L1.1", title: "Tap! Tap! Tap!", slug: "tap-tap-tap", country: "United Kingdom", flag: "🇬🇧", setting: "A busy morning at home" },
  { legacySub: "L1.2", title: "The Mud on the Dog", slug: "the-mud-on-the-dog", country: "United Kingdom", flag: "🇬🇧", setting: "A muddy British garden" },
  { legacySub: "L1.3", title: "The Fish in the Tank", slug: "the-fish-in-the-tank", country: "United Kingdom", flag: "🇬🇧", setting: "A new pet comes home" },
  { legacySub: "L1.4", title: "The Red Socks", slug: "the-red-socks", country: "United Kingdom", flag: "🇬🇧", setting: "Washing-day mischief at home" },
  { legacySub: "L1.5", title: "Run, Pup, Run!", slug: "run-pup-run", country: "United Kingdom", flag: "🇬🇧", setting: "A dash through a British park" },
  { legacySub: "L1.6", title: "Fox Fell Off!", slug: "fox-fell-off", country: "United Kingdom", flag: "🇬🇧", setting: "An adventure in a UK woodland" },
  { legacySub: "L2.2", title: "Hot Food, Cool Moon", slug: "hot-food-cool-moon", country: "United Kingdom", flag: "🇬🇧", setting: "A British street-food night market" },
  { legacySub: "L2.4", title: "The Fair in the Air", slug: "the-fair-in-the-air", country: "United Kingdom", flag: "🇬🇧", setting: "A village fair in England" },
  { legacySub: "L4.2", title: "The Brown Owl", slug: "the-brown-owl", country: "United Kingdom", flag: "🇬🇧", setting: "A British woodland at dusk" },
  { legacySub: "L5.1", title: "Before the Shore", slug: "before-the-shore", country: "United Kingdom", flag: "🇬🇧", setting: "A North London Jewish community" },

  // ── windows on the world ─────────────────────────────────────────
  { legacySub: "L1.7", title: "The Jam Jug", slug: "the-jam-jug", country: "Middle Eastern souk", flag: "🏺", setting: "A jam stall in a bustling souk" },
  { legacySub: "L1.8", title: "The Yak and the Box", slug: "the-yak-and-the-box", country: "Nepal", flag: "🇳🇵", setting: "A Himalayan village in Nepal" },
  { legacySub: "L1.9", title: "Chop, Chop, Chop!", slug: "chop-chop-chop", country: "Pakistan", flag: "🇵🇰", setting: "A family kitchen in Pakistan" },
  { legacySub: "L1.10", title: "Buzz and Sing!", slug: "buzz-and-sing", country: "Trinidad and Tobago", flag: "🇹🇹", setting: "A Caribbean garden in Trinidad" },
  { legacySub: "L2.1", title: "The Night Light", slug: "the-night-light", country: "Japan", flag: "🇯🇵", setting: "A Japanese garden after dark" },
  { legacySub: "L2.3", title: "Morning on the Farm", slug: "morning-on-the-farm", country: "Kenya", flag: "🇰🇪", setting: "A highlands farm in Kenya" },
  { legacySub: "L2.5", title: "Round and Round", slug: "round-and-round", country: "Iceland", flag: "🇮🇸", setting: "Snowy Reykjavik, Iceland" },
  { legacySub: "L2.6", title: "The Night Fair", slug: "the-night-fair", country: "Morocco", flag: "🇲🇦", setting: "A Marrakech-style night souk" },
  { legacySub: "L3.1", title: "The Big Bike Race", slug: "the-big-bike-race", country: "France", flag: "🇫🇷", setting: "The French countryside mid-race" },
  { legacySub: "L3.2", title: "Lost at the Night Market", slug: "lost-at-the-night-market", country: "Thailand", flag: "🇹🇭", setting: "A Bangkok night market" },
  { legacySub: "L3.3", title: "Reach for the Treat!", slug: "reach-for-the-treat", country: "Ghana", flag: "🇬🇭", setting: "A residential compound in Accra" },
  { legacySub: "L3.4", title: "Draw It Again", slug: "draw-it-again", country: "South Korea", flag: "🇰🇷", setting: "An art room in Seoul" },
  { legacySub: "L3.5", title: "The Boat with the Red Sail", slug: "the-boat-with-the-red-sail", country: "Spain", flag: "🇪🇸", setting: "A harbour on the Spanish coast" },
  { legacySub: "L4.1", title: "The Purple Purse", slug: "the-purple-purse", country: "Turkey", flag: "🇹🇷", setting: "The streets of Istanbul" },
  { legacySub: "L4.3", title: "The New Glue", slug: "the-new-glue", country: "Mexico", flag: "🇲🇽", setting: "A family home in Oaxaca" },
  { legacySub: "L4.4", title: "The Cheeky Monkey", slug: "the-cheeky-monkey", country: "Malaysia", flag: "🇲🇾", setting: "Putrajaya, Malaysia" },
  { legacySub: "L5.2", title: "Near the Door", slug: "near-the-door", country: "Sweden", flag: "🇸🇪", setting: "A snowy Stockholm winter" },
  { legacySub: "L5.3", title: "Sure She Can", slug: "sure-she-can", country: "India", flag: "🇮🇳", setting: "A Jaipur rooftop at kite-festival time" },
  { legacySub: "L5.4", title: "A Place for Me", slug: "a-place-for-me", country: "Colombia", flag: "🇨🇴", setting: "A morning fruit market in Cartagena" },
  { legacySub: "L6.1", title: "The Marvellous Neighbourhood", slug: "the-marvellous-neighbourhood", country: "Egypt", flag: "🇪🇬", setting: "A neighbourhood in Cairo" },
  { legacySub: "L6.2", title: "You Are Remarkable", slug: "you-are-remarkable", country: "China", flag: "🇨🇳", setting: "Lantern Festival in Guilin" },
  { legacySub: "L6.3", title: "It Looks Suspicious", slug: "it-looks-suspicious", country: "Italy", flag: "🇮🇹", setting: "A clifftop village on the Amalfi Coast" },
  { legacySub: "L6.4", title: "The Incredible Bush Walk", slug: "the-incredible-bush-walk", country: "Australia", flag: "🇦🇺", setting: "The Blue Mountains bush" },
];

export function libraryCoverUrl(b: LibraryWorldBook): string {
  return `/covers/${b.legacySub.slice(1).replace(".", "_")}_cover.jpg`;
}

/** Public (8-level journey) level for a library book. */
export function libraryJourneyLevel(b: LibraryWorldBook): number {
  const j = JOURNEY_SUBLEVEL_BY_LEGACY[b.legacySub];
  return j ? Number(j.slice(1).split(".")[0]) : Number(b.legacySub.slice(1).split(".")[0]);
}
