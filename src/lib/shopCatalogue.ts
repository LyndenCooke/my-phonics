/**
 * Physical shop catalogue: single source of truth for every product on
 * /shop. Edit prices here and nowhere else. Prices come from
 * marketing/MyPhonicsBooks_Physical_Price_List.xlsx (Price List sheet).
 *
 * Levels are JOURNEY levels (1-8, see src/lib/levels8.ts). School packs and
 * sound book packs are deliberately not listed: this page is for parents.
 *
 * Mockup images live in public/shop/ and are generated from the real print
 * PDFs by scripts/generate_shop_mockups.py (workbook covers are placeholder
 * art until the printed workbook exists).
 */

export type ShopSection =
  | 'bundle'
  | 'reader-single'
  | 'reader-set'
  | 'library'
  | 'workbook'
  | 'card-deck'
  | 'family'
  | 'accessory';

export interface ShopProduct {
  sku: string;
  name: string;
  section: ShopSection;
  /** Journey level 1-8, or null for cross-level products. */
  level: number | null;
  /** RRP in GBP. */
  price: number;
  /** What the contents cost bought separately, shown crossed out. */
  compareAt?: number;
  /** Per-unit value line, e.g. "about £3.90 a book". */
  valueNote?: string;
  /** One or two sentences for the product card. */
  blurb: string;
  /** Paragraphs for the detail view. */
  description: string[];
  contents: string[];
  spec: { label: string; value: string }[];
  /** Paths under public/, first image is the card image. */
  images: string[];
  crossSellSkus?: string[];
  badge?: string;
}

/** A storybook as sold individually. */
interface ReaderDef {
  level: number;
  index: number;
  title: string;
  sounds: string;
}

const READERS: ReaderDef[] = [
  { level: 1, index: 1, title: 'Tap! Tap! Tap!', sounds: 's, a, t, p, i, n' },
  { level: 1, index: 2, title: 'The Mud on the Dog', sounds: 'm, d, g, o' },
  { level: 2, index: 1, title: 'The Red Socks', sounds: 'c, k, ck, e' },
  { level: 2, index: 2, title: 'Run, Pup, Run!', sounds: 'u, r, h, b' },
  { level: 2, index: 3, title: 'Fox Fell Off!', sounds: 'f, l, ff, ll' },
  { level: 2, index: 4, title: 'The Jam Jug', sounds: 'j, v, w' },
  { level: 2, index: 5, title: 'The Yak and the Box', sounds: 'x, y, z' },
  { level: 3, index: 1, title: 'The Fish in the Tank', sounds: 'sh, nk' },
  { level: 3, index: 2, title: 'Chop, Chop, Chop!', sounds: 'ch, th' },
  { level: 3, index: 3, title: 'Buzz and Sing!', sounds: 'ng, qu, zz' },
  { level: 4, index: 1, title: 'The Night Light', sounds: 'ay, ee, igh' },
  { level: 4, index: 2, title: 'Moo at the Zoo', sounds: 'ow, oo' },
  { level: 4, index: 3, title: 'Morning on the Farm', sounds: 'ar, or' },
  { level: 4, index: 4, title: 'The Fair in the Air', sounds: 'air, ir' },
  { level: 4, index: 5, title: 'Round and Round', sounds: 'ou, oy' },
  { level: 4, index: 6, title: 'The Night Fair', sounds: 'all Level 4 sounds' },
  { level: 5, index: 1, title: 'The Big Bike Race', sounds: 'a-e, i-e' },
  { level: 5, index: 2, title: 'Lost at the Night Market', sounds: 'o-e, u-e' },
  { level: 5, index: 3, title: 'The Dream Team', sounds: 'ea, ie' },
  { level: 5, index: 4, title: 'What Min Saw', sounds: 'oi, aw' },
  { level: 5, index: 5, title: 'The Boat with the Red Sail', sounds: 'ai, oa' },
  { level: 6, index: 1, title: 'The Purple Purse', sounds: 'ur, er' },
  { level: 6, index: 2, title: 'The Brown Owl', sounds: 'are, ow' },
  { level: 6, index: 3, title: 'The New Glue', sounds: 'ew, ue' },
  { level: 6, index: 4, title: 'The Cheeky Monkey', sounds: 'all Level 6 sounds' },
  { level: 7, index: 1, title: 'Before the Shore', sounds: 'ire, ore' },
  { level: 7, index: 2, title: 'Near the Door', sounds: 'ear, oor' },
  { level: 7, index: 3, title: 'Sure She Can!', sounds: 'ure, tion' },
  { level: 7, index: 4, title: 'A Place for Me', sounds: 'all Level 7 sounds' },
  { level: 8, index: 1, title: 'The Marvellous Neighbourhood', sounds: '-ous' },
  { level: 8, index: 2, title: 'You Are Remarkable', sounds: '-able, -ible' },
  { level: 8, index: 3, title: 'It Looks Suspicious!', sounds: '-cious, -tious' },
  { level: 8, index: 4, title: 'The Incredible Bush Walk', sounds: 'all Level 8 suffixes' },
];

export const BOOKS_PER_LEVEL: Record<number, number> = {
  1: 2, 2: 5, 3: 3, 4: 6, 5: 5, 6: 4, 7: 4, 8: 4,
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Ditties', 2: 'First Sounds', 3: 'Special Friends', 4: 'Longer Sounds',
  5: 'New Spellings', 6: 'Building Fluency', 7: 'Reading Together', 8: 'Reading Champion',
};

/** Reader set RRPs per level (Price List: RS-L1..RS-L8). */
const SET_PRICES: Record<number, number> = {
  1: 10.99, 2: 24.99, 3: 14.99, 4: 34.99, 5: 29.99, 6: 23.99, 7: 23.99, 8: 23.99,
};

/** Word card deck RRPs and card counts per level (Price List: WC-L1..WC-L8). */
const WORD_DECK_PRICES: Record<number, number> = {
  1: 12.99, 2: 16.99, 3: 8.99, 4: 13.99, 5: 12.99, 6: 11.99, 7: 8.99, 8: 7.99,
};
const WORD_DECK_COUNTS: Record<number, number> = {
  1: 80, 2: 120, 3: 48, 4: 96, 5: 80, 6: 72, 7: 48, 8: 40,
};

const WORKBOOK_PRICE = 22.99;
const PEN_PACK_PRICE = 4.99;

/**
 * Level Starter Bundle prices. The price model (BN-LV) prices the bundle at
 * about £12 below its contents bought separately and gives £59.99 as the L4
 * example. A flat £59.99 would cost MORE than buying separately at five of
 * the eight levels (the L1 set is only £10.99), so each level gets the same
 * construction instead: separate total minus about £12, rounded to .99.
 * TODO(Lynden): confirm these derived bundle prices before launch.
 */
const BUNDLE_PRICES: Record<number, number> = {
  1: 34.99, 2: 52.99, 3: 34.99, 4: 59.99, 5: 53.99, 6: 46.99, 7: 43.99, 8: 42.99,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const bundleCompareAt = (level: number): number =>
  round2(SET_PRICES[level] + WORKBOOK_PRICE + WORD_DECK_PRICES[level]);

export const formatPrice = (n: number): string =>
  `£${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2)}`;

const readerSku = (r: ReaderDef) => `R-L${r.level}.${r.index}`;
const imageFor = (sku: string) => `/shop/${sku.toLowerCase().replace(/\./g, '-')}.webp`;

/* ── Singles ─────────────────────────────────────────────────────────── */

const singleReaders: ShopProduct[] = READERS.map((r) => {
  const price = r.level <= 3 ? 5.99 : 6.99;
  const pages = r.level <= 3 ? 16 : 20;
  const sku = readerSku(r);
  return {
    sku,
    name: r.title,
    section: 'reader-single' as const,
    level: r.level,
    price,
    blurb: `A Level ${r.level} storybook practising ${r.sounds}. Every word is decodable at this level or a taught tricky word.`,
    description: [
      `${r.title} is a real story, not a reading drill. It practises ${r.sounds} inside a narrative your child will want to finish, with page-turn moments and an emotional journey.`,
      'Because every word is decodable at this level or a taught tricky word, your child reads the whole book themselves. No guessing and no frustration; just the quiet pride of finishing a real book.',
      'Printed as a keepsake: silk paper inside, a matt-laminated cover that shrugs off small hands, and a size that fits a book bag.',
    ],
    contents: [`1 storybook: ${r.title}`, `Focus sounds: ${r.sounds}`, 'Activity and writing pages at the back', 'Reading Star certificate'],
    spec: [
      { label: 'Size', value: 'A5' },
      { label: 'Pages', value: `${pages}` },
      { label: 'Cover', value: 'Matt-laminated, 250gsm' },
      { label: 'Inside', value: '150gsm silk, full colour' },
      { label: 'Binding', value: 'Saddle-stitched' },
    ],
    images: [imageFor(sku)],
    crossSellSkus: [`RS-L${r.level}`, `WB-L${r.level}`],
  };
});

/* ── Level reader sets ───────────────────────────────────────────────── */

const readerSets: ShopProduct[] = Object.keys(SET_PRICES).map((k) => {
  const level = Number(k);
  const n = BOOKS_PER_LEVEL[level];
  const titles = READERS.filter((r) => r.level === level).map((r) => r.title);
  const singlePrice = level <= 3 ? 5.99 : 6.99;
  const sku = `RS-L${level}`;
  return {
    sku,
    name: `Level ${level} reader set: ${LEVEL_NAMES[level]}`,
    section: 'reader-set' as const,
    level,
    price: SET_PRICES[level],
    compareAt: round2(n * singlePrice),
    valueNote: `that is ${formatPrice(round2(SET_PRICES[level] / n))} a book`,
    blurb: `All ${n} Level ${level} storybooks in reading order. Everything your child reads at ${LEVEL_NAMES[level]}, in one set.`,
    description: [
      `The complete set of Level ${level} storybooks, in the order your child should read them. Each book introduces its sounds through a real story, and the set carries your child from the start of ${LEVEL_NAMES[level]} to ready-for-the-next-level.`,
      'Every word in every book is decodable at this level or a taught tricky word, so your child reads to you rather than the other way round.',
    ],
    contents: titles.map((t, i) => `Book ${i + 1}: ${t}`),
    spec: [
      { label: 'Books', value: `${n}` },
      { label: 'Size', value: 'A5' },
      { label: 'Cover', value: 'Matt-laminated' },
      { label: 'Binding', value: 'Saddle-stitched' },
    ],
    images: [imageFor(sku)],
    crossSellSkus: [`BN-L${level}`, `WB-L${level}`, `WC-L${level}`],
  };
});

/* ── Full library ────────────────────────────────────────────────────── */

const fullLibrary: ShopProduct = {
  sku: 'R-LIB',
  name: 'The full library, boxed',
  section: 'library',
  level: null,
  price: 129,
  compareAt: round2(2 * 5.99 + 5 * 5.99 + 3 * 5.99 + 6 * 6.99 + 5 * 6.99 + 4 * 6.99 + 4 * 6.99 + 4 * 6.99),
  valueNote: 'that is about £3.90 a book',
  blurb: 'All 33 storybooks, Level 1 to Level 8, in a keepsake box. The whole journey from first sounds to fluent reading.',
  description: [
    'Every storybook in the programme, boxed in reading order. Your child starts at Tap! Tap! Tap! with six sounds and finishes reading The Incredible Bush Walk on their own.',
    'Thirty-three books sounds like a lot until you watch a child work through them. Two or three books a level, each one within reach, each one a little further than the last. The box on the shelf becomes the record of how far they have come.',
    'Bought one at a time these books cost over £215. Boxed, the whole library is £129: about £3.90 a book.',
  ],
  contents: [
    'All 33 storybooks across Levels 1 to 8',
    'Boxed in reading order',
    'Level 1: 2 books · Level 2: 5 · Level 3: 3 · Level 4: 6',
    'Level 5: 5 books · Level 6: 4 · Level 7: 4 · Level 8: 4',
  ],
  spec: [
    { label: 'Books', value: '33' },
    { label: 'Size', value: 'A5, boxed' },
    { label: 'Cover', value: 'Matt-laminated' },
    { label: 'Inside', value: '150gsm silk, full colour' },
  ],
  images: ['/shop/r-lib.webp'],
  crossSellSkus: ['BN-FAM', 'SC-FULL'],
  badge: 'The whole journey',
};

/* ── Wipe-clean workbooks ────────────────────────────────────────────── */

const workbooks: ShopProduct[] = Object.keys(LEVEL_NAMES).map((k) => {
  const level = Number(k);
  const sku = `WB-L${level}`;
  return {
    sku,
    name: `Wipe-clean workbook: Level ${level}`,
    section: 'workbook' as const,
    level,
    price: WORKBOOK_PRICE,
    blurb: 'Every page is gloss-laminated. Your child writes with the included wet-erase pen, you wipe it clean with a damp cloth, and they practise again.',
    description: [
      `An A4 wiro-bound workbook where every page is gloss-laminated. Your child writes on it with the included wet-erase pen, you wipe it clean with a damp cloth, and they practise again. Handwriting, spelling tests, dictation and sentence work for the whole of Level ${level}, matched page for page to the books.`,
      'Buy once, practise forever. An ordinary workbook is finished in a fortnight; this one lasts the whole level and every sibling after.',
      'The wiro binding matters: it lies completely flat, so small hands can write on every line of every page.',
      'The pen matters too. Wet-erase ink stays put under a child’s hand while they write and only comes off with a damp cloth, so no smudged letters mid-word.',
      'One warning, stated plainly: wet-erase or dry-wipe pens only. A permanent marker will ruin the surface.',
    ],
    contents: [
      '1 reusable wipe-clean workbook',
      '1 fine-tip wet-erase pen',
      `Handwriting, spelling, dictation and sentence work for Level ${level}: ${LEVEL_NAMES[level]}`,
    ],
    spec: [
      { label: 'Size', value: 'A4' },
      { label: 'Binding', value: 'Wiro, lies flat' },
      { label: 'Pages', value: 'Gloss-laminated both sides' },
      { label: 'Pen', value: 'Wet-erase, fine tip, included' },
      { label: 'Care', value: 'Wipe with a damp cloth' },
    ],
    images: [imageFor(sku)],
    crossSellSkus: ['PEN-3', `RS-L${level}`],
  };
});

/* ── Card decks ──────────────────────────────────────────────────────── */

const soundCardDeck: ShopProduct = {
  sku: 'SC-FULL',
  name: 'Sound card deck, complete',
  section: 'card-deck',
  level: null,
  price: 24.99,
  blurb: 'Every sound in the programme on 150 premium A7 cards, including the seven-card ough wildcard insert.',
  description: [
    'One card per sound, for every sound your child meets from Level 1 to Level 8. Hold a card up, your child says the sound; that daily minute of practice is the engine of early reading.',
    'The deck grows with your child. Start with the single letters, add the two-letter sounds when they reach Level 3, and keep going to the suffixes at Level 8. The ough insert is the party trick: one spelling, seven sounds, and children love collecting them.',
    'Premium A7 cards, printed both sides and matt-laminated to survive years of small hands.',
  ],
  contents: [
    '143 sound cards covering Levels 1 to 8',
    '7-card ough wildcard insert',
    'Tuck box',
  ],
  spec: [
    { label: 'Cards', value: '150' },
    { label: 'Size', value: 'A7 (74 x 105mm)' },
    { label: 'Finish', value: 'Matt-laminated, printed both sides' },
    { label: 'Box', value: 'Tuck box included' },
  ],
  images: ['/shop/sc-full.webp'],
  crossSellSkus: ['R-LIB', 'BN-FAM'],
};

const wordCardDecks: ShopProduct[] = Object.keys(WORD_DECK_PRICES).map((k) => {
  const level = Number(k);
  const sku = `WC-L${level}`;
  return {
    sku,
    name: `Word card deck: Level ${level}`,
    section: 'card-deck' as const,
    level,
    price: WORD_DECK_PRICES[level],
    blurb: `${WORD_DECK_COUNTS[level]} cards for Level ${level}: each sound with its practice words, plain on the front and marked on the back.`,
    description: [
      `Eight cards per sound: one sound card and seven practice words your child can read at Level ${level}. The front shows the word exactly as it appears in a book; turn it over and the back shows the same word with its sounds marked, so you can see at a glance how to help.`,
      'Use them for two-minute games: read the word, find the sound, beat yesterday’s pile. Short and often beats long and rarely.',
    ],
    contents: [
      `${WORD_DECK_COUNTS[level]} cards: sound cards plus practice words`,
      'Plain fronts, marked backs',
      'Tuck box',
    ],
    spec: [
      { label: 'Cards', value: `${WORD_DECK_COUNTS[level]}` },
      { label: 'Size', value: 'A7 (74 x 105mm)' },
      { label: 'Finish', value: 'Matt-laminated, printed both sides' },
    ],
    images: [imageFor(sku)],
    crossSellSkus: [`RS-L${level}`, `BN-L${level}`],
  };
});

/* ── Level starter bundles (the hero offer) ──────────────────────────── */

const levelBundles: ShopProduct[] = Object.keys(BUNDLE_PRICES).map((k) => {
  const level = Number(k);
  const n = BOOKS_PER_LEVEL[level];
  const sku = `BN-L${level}`;
  const compareAt = bundleCompareAt(level);
  return {
    sku,
    name: `Level ${level} Starter Bundle: ${LEVEL_NAMES[level]}`,
    section: 'bundle' as const,
    level,
    price: BUNDLE_PRICES[level],
    compareAt,
    valueNote: `saves ${formatPrice(round2(compareAt - BUNDLE_PRICES[level]))} against buying separately`,
    blurb: `Everything your child needs for Level ${level}: all ${n} storybooks, the wipe-clean workbook with pen and the word card deck.`,
    description: [
      `One box, one level, everything in it. The complete ${LEVEL_NAMES[level]} reader set, the reusable wipe-clean workbook with its wet-erase pen, and the Level ${level} word card deck.`,
      'The three pieces work together: the cards for quick daily practice, the books for real reading, the workbook for writing it all down (and wiping it off, and doing it again).',
      'If you know your child’s level, this is the one to buy.',
    ],
    contents: [
      `All ${n} Level ${level} storybooks`,
      'Wipe-clean workbook with wet-erase pen',
      `Word card deck (${WORD_DECK_COUNTS[level]} cards)`,
    ],
    spec: [
      { label: 'Books', value: `${n} x A5 readers` },
      { label: 'Workbook', value: 'A4 wiro, gloss-laminated, pen included' },
      { label: 'Cards', value: `${WORD_DECK_COUNTS[level]} x A7, boxed` },
    ],
    images: [imageFor(sku)],
    crossSellSkus: ['PEN-3', `BN-L${Math.min(level + 1, 8)}`],
    badge: 'Best start',
  };
});

/* ── Family bundle ───────────────────────────────────────────────────── */

const familyBundle: ShopProduct = {
  sku: 'BN-FAM',
  name: 'Family full-scheme bundle',
  section: 'family',
  level: null,
  price: 349,
  compareAt: round2(129 + 8 * WORKBOOK_PRICE + 24.99 + Object.values(WORD_DECK_PRICES).reduce((a, b) => a + b, 0)),
  blurb: 'The whole programme in one delivery: the boxed library, all 8 wipe-clean workbooks with pens, the complete sound card deck and every word card deck.',
  description: [
    'Everything, once, for every child in the house. The full 33-book library, a wipe-clean workbook and pen for each of the 8 levels, the complete sound card deck and all 8 word card decks.',
    'Because the workbooks wipe clean and the books are made to last, the whole scheme passes straight down to the next sibling. One purchase, Reception to Year 2 and beyond, child after child.',
  ],
  contents: [
    'Full reader library, boxed (33 books)',
    '8 wipe-clean workbooks, each with a wet-erase pen',
    'Complete sound card deck (150 cards)',
    'All 8 word card decks (584 cards)',
  ],
  spec: [
    { label: 'Books', value: '33 x A5 readers, boxed' },
    { label: 'Workbooks', value: '8 x A4 wiro, gloss-laminated' },
    { label: 'Cards', value: '734 across 9 decks' },
  ],
  images: ['/shop/bn-fam.webp'],
  crossSellSkus: ['PEN-3'],
  badge: 'Everything',
};

/* ── Accessories ─────────────────────────────────────────────────────── */

const penPack: ShopProduct = {
  sku: 'PEN-3',
  name: 'Replacement pen pack',
  section: 'accessory',
  level: null,
  price: PEN_PACK_PRICE,
  blurb: 'Three fine-tip wet-erase pens for the wipe-clean workbooks. Pens wander; the workbook should not have to wait.',
  description: [
    'Three fine-tip wet-erase pens, the same type that comes with every wipe-clean workbook. The ink stays put while your child writes and wipes off with a damp cloth.',
    'A reminder that saves workbooks: wet-erase or dry-wipe pens only. A permanent marker will ruin the laminated surface.',
  ],
  contents: ['3 fine-tip wet-erase pens'],
  spec: [
    { label: 'Tip', value: 'Fine, for letter formation' },
    { label: 'Ink', value: 'Wet-erase: wipes off with a damp cloth' },
  ],
  images: ['/shop/pen-3.webp'],
  crossSellSkus: ['WB-L1'],
};

/* ── Exports ─────────────────────────────────────────────────────────── */

export const SHOP_PRODUCTS: ShopProduct[] = [
  ...levelBundles,
  ...singleReaders,
  ...readerSets,
  fullLibrary,
  ...workbooks,
  soundCardDeck,
  ...wordCardDecks,
  familyBundle,
  penPack,
];

export const getProduct = (sku: string): ShopProduct | undefined =>
  SHOP_PRODUCTS.find((p) => p.sku === sku);

export const bySection = (section: ShopSection): ShopProduct[] =>
  SHOP_PRODUCTS.filter((p) => p.section === section);

/* ── Peek-inside previews ────────────────────────────────────────────────
 * Teaser page/card images generated by scripts/generate_shop_previews.py into
 * public/shop/preview/<sku>/. Only readers, workbooks and card decks have
 * their own assets; collections borrow a representative product's preview.
 * The final book page and the last card are blurred (baked in) and the UI
 * locks them, so the full content is never given away free.
 */
export interface PreviewData {
  kind: 'book' | 'cards';
  label: string;
  /** Product the preview is drawn from (may differ from the one clicked). */
  sourceName: string;
  pages?: string[];
  cards?: { front: string; back: string }[];
  /** Word cards are A7 landscape; sound cards are A7 portrait. */
  cardLandscape?: boolean;
}

const previewDir = (sku: string) => `/shop/preview/${sku.toLowerCase().replace(/\./g, '-')}`;

/** Which product's generated assets stand in for this SKU's preview. */
function previewSourceSku(p: ShopProduct): string | null {
  switch (p.section) {
    case 'reader-single':
    case 'workbook':
      return p.sku;
    case 'card-deck':
      return p.sku; // SC-FULL or WC-L{n}
    case 'reader-set':
    case 'bundle':
      return `R-L${p.level}.1`; // that level's flagship reader
    case 'library':
    case 'family':
      return 'R-L1.1'; // open on the very first book
    default:
      return null; // accessories have nothing to peek inside
  }
}

export function getPreview(sku: string): PreviewData | null {
  const p = getProduct(sku);
  if (!p) return null;
  const src = previewSourceSku(p);
  if (!src) return null;
  const source = getProduct(src);
  const dir = previewDir(src);

  if (src === 'SC-FULL' || /^WC-L\d$/.test(src)) {
    return {
      kind: 'cards',
      label: 'Take a peek at the cards',
      sourceName: source?.name ?? p.name,
      cardLandscape: /^WC-L\d$/.test(src), // word cards are landscape; sound cards portrait
      cards: [1, 2, 3, 4].map((k) => ({
        front: `${dir}/c${k}-front.webp`,
        back: `${dir}/c${k}-back.webp`,
      })),
    };
  }
  const borrowed = src !== p.sku && source;
  return {
    kind: 'book',
    label: borrowed ? 'Take a peek inside a sample book' : 'Take a peek inside',
    sourceName: source?.name ?? p.name,
    pages: [1, 2, 3, 4, 5].map((i) => `${dir}/p${i}.webp`),
  };
}
