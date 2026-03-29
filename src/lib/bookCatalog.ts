/**
 * Complete book catalog — local fallback for books not yet in Supabase.
 * When Supabase has the book (matched by sub_level), the DB version wins.
 * Otherwise the local entry is used so ALL books appear in the library.
 */

export interface CatalogBook {
  level: number;
  sub_level: string;
  title: string;
  slug: string;
  focus_sounds: string[];
  tricky_words: string[];
  story_words: string[];
  cover_image_url: string | null;
  pdf_url: string | null;
  page_count: number;
  sort_order: number;
  is_free_sample: boolean;
  is_published: boolean;
}

export const BOOK_CATALOG: CatalogBook[] = [
  // ── Level 1 ──────────────────────────────────────────────
  { level: 1, sub_level: "L1.1", title: "Tap! Tap! Tap!", slug: "tap-tap-tap", focus_sounds: ["s","a","t","p","i","n"], tricky_words: ["the","to","I"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 11, is_free_sample: true, is_published: true },
  { level: 1, sub_level: "L1.2", title: "The Mud on the Dog", slug: "the-mud-on-the-dog", focus_sounds: ["m","d","g","o"], tricky_words: ["the","to","I","no"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 12, is_free_sample: true, is_published: true },
  { level: 1, sub_level: "L1.3", title: "The Fish in the Tank", slug: "the-fish-in-the-tank", focus_sounds: ["sh","nk"], tricky_words: ["the","I","into"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 13, is_free_sample: false, is_published: true },
  { level: 1, sub_level: "L1.4", title: "The Red Socks", slug: "the-red-socks", focus_sounds: ["c","k","ck","e"], tricky_words: ["the","I","no"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 14, is_free_sample: false, is_published: true },
  { level: 1, sub_level: "L1.5", title: "Run, Pup, Run!", slug: "run-pup-run", focus_sounds: ["u","r","h","b"], tricky_words: ["the","to","I"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 15, is_free_sample: false, is_published: true },
  { level: 1, sub_level: "L1.6", title: "Fox Fell Off!", slug: "fox-fell-off", focus_sounds: ["f","l","ff","ll"], tricky_words: ["the","I","no"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 16, is_free_sample: false, is_published: true },
  { level: 1, sub_level: "L1.7", title: "The Jam Jug", slug: "the-jam-jug", focus_sounds: ["j","v","w"], tricky_words: ["the","I","into"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 17, is_free_sample: false, is_published: true },
  { level: 1, sub_level: "L1.8", title: "The Yak and the Box", slug: "the-yak-and-the-box", focus_sounds: ["x","y","z"], tricky_words: ["the","I","no"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 18, is_free_sample: false, is_published: true },
  { level: 1, sub_level: "L1.9", title: "Chop, Chop, Chop!", slug: "chop-chop-chop", focus_sounds: ["ch","th"], tricky_words: ["the","I","to"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 19, is_free_sample: false, is_published: true },
  { level: 1, sub_level: "L1.10", title: "Buzz and Sing!", slug: "buzz-and-sing", focus_sounds: ["ng","qu","ss","zz"], tricky_words: ["the","I","go"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 110, is_free_sample: false, is_published: true },

  // ── Level 2 ──────────────────────────────────────────────
  { level: 2, sub_level: "L2.1", title: "The Night Light", slug: "the-night-light", focus_sounds: ["ay","ee","igh"], tricky_words: ["he","she","we","me"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 21, is_free_sample: false, is_published: true },
  { level: 2, sub_level: "L2.2", title: "Moo at the Zoo", slug: "moo-at-the-zoo", focus_sounds: ["ow","oo"], tricky_words: ["you","said","your"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 22, is_free_sample: false, is_published: true },
  { level: 2, sub_level: "L2.3", title: "Morning on the Farm", slug: "morning-on-the-farm", focus_sounds: ["ar","or"], tricky_words: ["her","are","put"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 23, is_free_sample: false, is_published: true },
  { level: 2, sub_level: "L2.4", title: "The Fair in the Air", slug: "the-fair-in-the-air", focus_sounds: ["air","ir"], tricky_words: ["my","be","said"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 24, is_free_sample: false, is_published: true },
  { level: 2, sub_level: "L2.5", title: "Round and Round", slug: "round-and-round", focus_sounds: ["ou","oy"], tricky_words: ["you","your","are"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 25, is_free_sample: false, is_published: true },

  // ── Level 3 ──────────────────────────────────────────────
  { level: 3, sub_level: "L3.1", title: "The Big Bike Race", slug: "the-big-bike-race", focus_sounds: ["a-e","i-e"], tricky_words: ["all","like","want"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 31, is_free_sample: false, is_published: true },
  { level: 3, sub_level: "L3.2", title: "The Stone Flute", slug: "the-stone-flute", focus_sounds: ["o-e","u-e"], tricky_words: ["some","what","they"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 32, is_free_sample: false, is_published: true },
  { level: 3, sub_level: "L3.3", title: "Reach for the Treat!", slug: "reach-for-the-treat", focus_sounds: ["ea","ie"], tricky_words: ["call","do","old"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 33, is_free_sample: false, is_published: true },
  { level: 3, sub_level: "L3.4", title: "Draw It Again", slug: "draw-it-again", focus_sounds: ["oi","aw"], tricky_words: ["was","so","what"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 34, is_free_sample: false, is_published: true },
  { level: 3, sub_level: "L3.5", title: "The Boat with the Red Sail", slug: "the-boat-with-the-red-sail", focus_sounds: ["ai","oa"], tricky_words: ["all","some","they"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 35, is_free_sample: false, is_published: true },

  // ── Level 4 ──────────────────────────────────────────────
  { level: 4, sub_level: "L4.1", title: "The Purple Purse", slug: "the-purple-purse", focus_sounds: ["ur","er"], tricky_words: ["saw","watch","their"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 41, is_free_sample: false, is_published: true },
  { level: 4, sub_level: "L4.2", title: "The Brown Owl", slug: "the-brown-owl", focus_sounds: ["are","ow"], tricky_words: ["where","were","small"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 42, is_free_sample: false, is_published: true },
  { level: 4, sub_level: "L4.3", title: "The New Glue", slug: "the-new-glue", focus_sounds: ["ew","ue"], tricky_words: ["school","who","brother"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 43, is_free_sample: false, is_published: true },
  { level: 4, sub_level: "L4.4", title: "The Cheeky Monkey", slug: "the-cheeky-monkey", focus_sounds: ["ur","er","are","ow","ew","ue"], tricky_words: ["any","tall","fall"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 44, is_free_sample: false, is_published: true },

  // ── Level 5 ──────────────────────────────────────────────
  { level: 5, sub_level: "L5.1", title: "Before the Shore", slug: "before-the-shore", focus_sounds: ["ire","ore"], tricky_words: ["does","could","would"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 51, is_free_sample: false, is_published: true },
  { level: 5, sub_level: "L5.2", title: "Near the Door", slug: "near-the-door", focus_sounds: ["ear","oor"], tricky_words: ["anyone","over","through"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 52, is_free_sample: false, is_published: true },
  { level: 5, sub_level: "L5.3", title: "Sure She Can", slug: "sure-she-can", focus_sounds: ["ure","tion"], tricky_words: ["once","whole","people"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 53, is_free_sample: false, is_published: true },
  { level: 5, sub_level: "L5.4", title: "A Place for Me", slug: "a-place-for-me", focus_sounds: ["ire","ore","ear","oor","ure","tion"], tricky_words: ["water","people","through"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 54, is_free_sample: false, is_published: true },

  // ── Level 6 ──────────────────────────────────────────────
  { level: 6, sub_level: "L6.1", title: "The Marvellous Neighbourhood", slug: "the-marvellous-neighbourhood", focus_sounds: ["ous"], tricky_words: ["should","many","above"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 61, is_free_sample: false, is_published: true },
  { level: 6, sub_level: "L6.2", title: "You Are Remarkable", slug: "you-are-remarkable", focus_sounds: ["able","ible"], tricky_words: ["father","mother","great"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 62, is_free_sample: false, is_published: true },
  { level: 6, sub_level: "L6.3", title: "It Looks Suspicious", slug: "it-looks-suspicious", focus_sounds: ["cious","tious"], tricky_words: ["bought","caught","thought"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 63, is_free_sample: false, is_published: true },
  { level: 6, sub_level: "L6.4", title: "The Incredible Bush Walk", slug: "the-incredible-bush-walk", focus_sounds: ["ous","able","ible","cious","tious"], tricky_words: ["everyone","walk","talk"], story_words: [], cover_image_url: null, pdf_url: null, page_count: 24, sort_order: 64, is_free_sample: false, is_published: true },
];
