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

/**
 * Translatable copy. `key` lives in the `shop` namespace
 * (src/i18n/locales/<lng>/shop.json, under `catalogue.*`); the English text
 * is in locales/en/shop.json. Plain strings (sizes like "A5", counts) are
 * shown as they are. Resolve with `useShopText()` (src/components/shop/useShopText.ts).
 */
export interface Tx {
  key: string;
  vars?: Record<string, string | number | Tx>;
}
export type ShopText = Tx | string;
const tx = (key: string, vars?: Tx['vars']): Tx => ({ key: `catalogue.${key}`, vars });

export interface ShopProduct {
  sku: string;
  /** Product names stay English (they are printed on the products). */
  name: string;
  section: ShopSection;
  /** Journey level 1-8, or null for cross-level products. */
  level: number | null;
  /** RRP in GBP. */
  price: number;
  /** What the contents cost bought separately, shown crossed out. */
  compareAt?: number;
  /** Per-unit value line, e.g. "about £3.90 a book". */
  valueNote?: ShopText;
  /** One or two sentences for the product card. */
  blurb: ShopText;
  /** Paragraphs for the detail view. */
  description: ShopText[];
  contents: ShopText[];
  spec: { label: ShopText; value: ShopText }[];
  /** Paths under public/, first image is the card image. */
  images: string[];
  crossSellSkus?: string[];
  badge?: ShopText;
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
  { level: 4, index: 2, title: 'Hot Food, Cool Moon', sounds: 'ow, oo' },
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

/** "all Level 4 sounds" is parent-facing prose; real sound lists stay as-is. */
const soundsText = (r: ReaderDef): ShopText =>
  r.sounds === `all Level ${r.level} sounds`
    ? tx('soundsAll', { level: r.level })
    : r.sounds === `all Level ${r.level} suffixes`
    ? tx('suffixesAll', { level: r.level })
    : r.sounds;

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

/* Spec labels and repeated spec values. */
const L = {
  size: tx('spec.size'), pages: tx('spec.pages'), cover: tx('spec.cover'), inside: tx('spec.inside'),
  binding: tx('spec.binding'), books: tx('spec.books'), workbook: tx('spec.workbook'),
  workbooks: tx('spec.workbooks'), cards: tx('spec.cards'), finish: tx('spec.finish'), box: tx('spec.box'),
  tip: tx('spec.tip'), ink: tx('spec.ink'), pen: tx('spec.pen'), care: tx('spec.care'),
};
const V = {
  matt: tx('specValue.matt'),
  silk: tx('specValue.silk'),
  saddle: tx('specValue.saddle'),
  a7: tx('specValue.a7'),
  mattBoth: tx('specValue.mattBoth'),
};

/* ── Singles ─────────────────────────────────────────────────────────── */

const singleReaders: ShopProduct[] = READERS.map((r) => {
  const price = r.level <= 3 ? 5.99 : 6.99;
  const pages = r.level <= 3 ? 16 : 20;
  const sku = readerSku(r);
  const vars = { level: r.level, title: r.title, sounds: soundsText(r) };
  return {
    sku,
    name: r.title,
    section: 'reader-single' as const,
    level: r.level,
    price,
    blurb: tx('reader.blurb', vars),
    description: [tx('reader.d1', vars), tx('reader.d2'), tx('reader.d3')],
    contents: [tx('reader.c1', vars), tx('reader.c2', vars), tx('reader.c3'), tx('reader.c4')],
    spec: [
      { label: L.size, value: 'A5' },
      { label: L.pages, value: `${pages}` },
      { label: L.cover, value: tx('specValue.matt250') },
      { label: L.inside, value: V.silk },
      { label: L.binding, value: V.saddle },
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
  const vars = { level, n, levelName: LEVEL_NAMES[level] };
  return {
    sku,
    name: `Level ${level} reader set: ${LEVEL_NAMES[level]}`,
    section: 'reader-set' as const,
    level,
    price: SET_PRICES[level],
    compareAt: round2(n * singlePrice),
    valueNote: tx('readerSet.valueNote', { price: formatPrice(round2(SET_PRICES[level] / n)) }),
    blurb: tx('readerSet.blurb', vars),
    description: [tx('readerSet.d1', vars), tx('readerSet.d2')],
    contents: titles.map((title, i) => tx('readerSet.book', { n: i + 1, title })),
    spec: [
      { label: L.books, value: `${n}` },
      { label: L.size, value: 'A5' },
      { label: L.cover, value: V.matt },
      { label: L.binding, value: V.saddle },
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
  valueNote: tx('library.valueNote'),
  blurb: tx('library.blurb'),
  description: [
    tx('library.d1', { first: 'Tap! Tap! Tap!', last: 'The Incredible Bush Walk' }),
    tx('library.d2'),
    tx('library.d3'),
  ],
  contents: [tx('library.c1'), tx('library.c2'), tx('library.c3'), tx('library.c4')],
  spec: [
    { label: L.books, value: '33' },
    { label: L.size, value: tx('specValue.a5Boxed') },
    { label: L.cover, value: V.matt },
    { label: L.inside, value: V.silk },
  ],
  images: ['/shop/r-lib.webp'],
  crossSellSkus: ['BN-FAM', 'SC-FULL'],
  badge: tx('library.badge'),
};

/* ── Wipe-clean workbooks ────────────────────────────────────────────── */

const workbooks: ShopProduct[] = Object.keys(LEVEL_NAMES).map((k) => {
  const level = Number(k);
  const sku = `WB-L${level}`;
  const vars = { level, levelName: LEVEL_NAMES[level] };
  return {
    sku,
    name: `Wipe-clean workbook: Level ${level}`,
    section: 'workbook' as const,
    level,
    price: WORKBOOK_PRICE,
    blurb: tx('workbook.blurb'),
    description: [tx('workbook.d1', vars), tx('workbook.d2'), tx('workbook.d3'), tx('workbook.d4'), tx('workbook.d5')],
    contents: [tx('workbook.c1'), tx('workbook.c2'), tx('workbook.c3', vars)],
    spec: [
      { label: L.size, value: 'A4' },
      { label: L.binding, value: tx('specValue.wiroFlat') },
      { label: L.pages, value: tx('specValue.glossBoth') },
      { label: L.pen, value: tx('specValue.penIncluded') },
      { label: L.care, value: tx('specValue.care') },
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
  blurb: tx('soundDeck.blurb'),
  description: [tx('soundDeck.d1'), tx('soundDeck.d2'), tx('soundDeck.d3')],
  contents: [tx('soundDeck.c1'), tx('soundDeck.c2'), tx('soundDeck.c3')],
  spec: [
    { label: L.cards, value: '150' },
    { label: L.size, value: V.a7 },
    { label: L.finish, value: V.mattBoth },
    { label: L.box, value: tx('specValue.tuckIncluded') },
  ],
  images: ['/shop/sc-full.webp'],
  crossSellSkus: ['R-LIB', 'BN-FAM'],
};

const wordCardDecks: ShopProduct[] = Object.keys(WORD_DECK_PRICES).map((k) => {
  const level = Number(k);
  const sku = `WC-L${level}`;
  const vars = { level, n: WORD_DECK_COUNTS[level] };
  return {
    sku,
    name: `Word card deck: Level ${level}`,
    section: 'card-deck' as const,
    level,
    price: WORD_DECK_PRICES[level],
    blurb: tx('wordDeck.blurb', vars),
    description: [tx('wordDeck.d1', vars), tx('wordDeck.d2')],
    contents: [tx('wordDeck.c1', vars), tx('wordDeck.c2'), tx('wordDeck.c3')],
    spec: [
      { label: L.cards, value: `${WORD_DECK_COUNTS[level]}` },
      { label: L.size, value: V.a7 },
      { label: L.finish, value: V.mattBoth },
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
  const vars = { level, n, levelName: LEVEL_NAMES[level], cards: WORD_DECK_COUNTS[level] };
  return {
    sku,
    name: `Level ${level} Starter Bundle: ${LEVEL_NAMES[level]}`,
    section: 'bundle' as const,
    level,
    price: BUNDLE_PRICES[level],
    compareAt,
    valueNote: tx('bundle.valueNote', { amount: formatPrice(round2(compareAt - BUNDLE_PRICES[level])) }),
    blurb: tx('bundle.blurb', vars),
    description: [tx('bundle.d1', vars), tx('bundle.d2'), tx('bundle.d3')],
    contents: [tx('bundle.c1', vars), tx('bundle.c2'), tx('bundle.c3', vars)],
    spec: [
      { label: L.books, value: tx('specValue.readersA5', vars) },
      { label: L.workbook, value: tx('specValue.workbookBundle') },
      { label: L.cards, value: tx('specValue.cardsBoxed', vars) },
    ],
    images: [imageFor(sku)],
    crossSellSkus: ['PEN-3', `BN-L${Math.min(level + 1, 8)}`],
    badge: tx('bundle.badge'),
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
  blurb: tx('family.blurb'),
  description: [tx('family.d1'), tx('family.d2')],
  contents: [tx('family.c1'), tx('family.c2'), tx('family.c3'), tx('family.c4')],
  spec: [
    { label: L.books, value: tx('specValue.readersBoxed') },
    { label: L.workbooks, value: tx('specValue.workbooks8') },
    { label: L.cards, value: tx('specValue.cardsAll') },
  ],
  images: ['/shop/bn-fam.webp'],
  crossSellSkus: ['PEN-3'],
  badge: tx('family.badge'),
};

/* ── Accessories ─────────────────────────────────────────────────────── */

const penPack: ShopProduct = {
  sku: 'PEN-3',
  name: 'Replacement pen pack',
  section: 'accessory',
  level: null,
  price: PEN_PACK_PRICE,
  blurb: tx('pens.blurb'),
  description: [tx('pens.d1'), tx('pens.d2')],
  contents: [tx('pens.c1')],
  spec: [
    { label: L.tip, value: tx('specValue.tipFine') },
    { label: L.ink, value: tx('specValue.inkWet') },
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
  label: ShopText;
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
      label: tx('preview.cards'),
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
    label: borrowed ? tx('preview.sampleBook') : tx('preview.book'),
    sourceName: source?.name ?? p.name,
    pages: [1, 2, 3, 4, 5].map((i) => `${dir}/p${i}.webp`),
  };
}
