/**
 * 33-book catalogue for the school-8 structure.
 *
 * Mapping from production (parent-6) sub_levels per rwi_aligned_proposal.md
 * section 5. Titles are taken from the production catalogue verbatim.
 */

export interface SchoolBook {
  level: number;
  subLevel: string;          // school-8 ID, e.g. "L3.1"
  parent6SubLevel: string;   // original ID, e.g. "L1.3" — for looking up shipped PDF + interactive pages
  title: string;
  slug: string;
  focusSounds: string[];
  trickyWords: string[];
  storyWords: string[];
  sortOrder: number;
  isFreeSample: boolean;
}

export const SCHOOL_BOOKS: SchoolBook[] = [
  // ── L1 Ditties ──────────────────────────────────────────────
  { level: 1, subLevel: 'L1.1', parent6SubLevel: 'L1.1', title: 'Tap! Tap! Tap!',                slug: 'tap-tap-tap',                focusSounds: ['s','a','t','p','i','n'],                                              trickyWords: ['the','I'],                       storyWords: [],                                                                  sortOrder: 11, isFreeSample: true  },
  { level: 1, subLevel: 'L1.2', parent6SubLevel: 'L1.2', title: 'The Mud on the Dog',            slug: 'the-mud-on-the-dog',         focusSounds: ['m','d','g','o'],                                                       trickyWords: ['the','I'],                       storyWords: [],                                                                  sortOrder: 12, isFreeSample: false },

  // ── L2 First Sounds ─────────────────────────────────────────
  { level: 2, subLevel: 'L2.1', parent6SubLevel: 'L1.4', title: 'The Red Socks',                 slug: 'the-red-socks',              focusSounds: ['c','k','ck','e'],                                                      trickyWords: ['the','I','no'],                  storyWords: [],                                                                  sortOrder: 21, isFreeSample: true  },
  { level: 2, subLevel: 'L2.2', parent6SubLevel: 'L1.5', title: 'Run, Pup, Run!',                slug: 'run-pup-run',                focusSounds: ['u','r','h','b'],                                                       trickyWords: ['the','to','I'],                  storyWords: [],                                                                  sortOrder: 22, isFreeSample: false },
  { level: 2, subLevel: 'L2.3', parent6SubLevel: 'L1.6', title: 'Fox Fell Off!',                 slug: 'fox-fell-off',               focusSounds: ['f','l','ff','ll'],                                                     trickyWords: ['the','I','no'],                  storyWords: [],                                                                  sortOrder: 23, isFreeSample: false },
  { level: 2, subLevel: 'L2.4', parent6SubLevel: 'L1.7', title: 'The Jam Jug',                   slug: 'the-jam-jug',                focusSounds: ['j','v','w'],                                                           trickyWords: ['the','I','into'],                storyWords: [],                                                                  sortOrder: 24, isFreeSample: false },
  { level: 2, subLevel: 'L2.5', parent6SubLevel: 'L1.8', title: 'The Yak and the Box',           slug: 'the-yak-and-the-box',        focusSounds: ['x','y','z'],                                                           trickyWords: ['the','I','no'],                  storyWords: [],                                                                  sortOrder: 25, isFreeSample: false },

  // ── L3 Special Friends ──────────────────────────────────────
  { level: 3, subLevel: 'L3.1', parent6SubLevel: 'L1.3',  title: 'The Fish in the Tank',         slug: 'the-fish-in-the-tank',       focusSounds: ['sh','nk'],                                                              trickyWords: ['the','I','into'],                storyWords: [],                                                                  sortOrder: 31, isFreeSample: false },
  { level: 3, subLevel: 'L3.2', parent6SubLevel: 'L1.9',  title: 'Chop, Chop, Chop!',            slug: 'chop-chop-chop',             focusSounds: ['ch','th'],                                                              trickyWords: ['the','I','to'],                  storyWords: [],                                                                  sortOrder: 32, isFreeSample: false },
  { level: 3, subLevel: 'L3.3', parent6SubLevel: 'L1.10', title: 'Buzz and Sing!',               slug: 'buzz-and-sing',              focusSounds: ['ng','qu','zz'],                                                         trickyWords: ['the','I','go'],                  storyWords: [],                                                                  sortOrder: 33, isFreeSample: false },

  // ── L4 Longer Sounds (was old L2) ───────────────────────────
  { level: 4, subLevel: 'L4.1', parent6SubLevel: 'L2.1', title: 'The Night Light',               slug: 'the-night-light',            focusSounds: ['ay','ee','igh'],                                                       trickyWords: ['he','she','we','me'],            storyWords: [],                                                                  sortOrder: 41, isFreeSample: true  },
  { level: 4, subLevel: 'L4.2', parent6SubLevel: 'L2.2', title: 'Moo at the Zoo',                slug: 'moo-at-the-zoo',             focusSounds: ['ow','oo'],                                                              trickyWords: ['you','said','your'],             storyWords: [],                                                                  sortOrder: 42, isFreeSample: false },
  { level: 4, subLevel: 'L4.3', parent6SubLevel: 'L2.3', title: 'Morning on the Farm',           slug: 'morning-on-the-farm',        focusSounds: ['ar','or'],                                                              trickyWords: ['her','are','put'],               storyWords: [],                                                                  sortOrder: 43, isFreeSample: false },
  { level: 4, subLevel: 'L4.4', parent6SubLevel: 'L2.4', title: 'The Fair in the Air',           slug: 'the-fair-in-the-air',        focusSounds: ['air','ir'],                                                             trickyWords: ['my','be','said'],                storyWords: [],                                                                  sortOrder: 44, isFreeSample: false },
  { level: 4, subLevel: 'L4.5', parent6SubLevel: 'L2.5', title: 'Round and Round',               slug: 'round-and-round',            focusSounds: ['ou','oy'],                                                              trickyWords: ['you','your','are'],              storyWords: [],                                                                  sortOrder: 45, isFreeSample: false },
  { level: 4, subLevel: 'L4.6', parent6SubLevel: 'L2.6', title: 'The Night Fair',                slug: 'the-night-fair',             focusSounds: ['ay','ee','igh','ow','oo','ar','or','air','ir','ou','oy'],               trickyWords: ['the','I','we','to','my','are','said'], storyWords: [],                                                            sortOrder: 46, isFreeSample: false },

  // ── L5 New Spellings (was old L3) ───────────────────────────
  { level: 5, subLevel: 'L5.1', parent6SubLevel: 'L3.1', title: 'The Big Bike Race',             slug: 'the-big-bike-race',          focusSounds: ['a-e','i-e'],                                                            trickyWords: ['all','like','want'],             storyWords: [],                                                                  sortOrder: 51, isFreeSample: true  },
  { level: 5, subLevel: 'L5.2', parent6SubLevel: 'L3.2', title: 'Lost at the Night Market',      slug: 'lost-at-the-night-market',   focusSounds: ['o-e','u-e'],                                                            trickyWords: ['I','the','you','she','we','elephant'], storyWords: ['close','spoke','huge','stone','bright','noodle'],            sortOrder: 52, isFreeSample: false },
  { level: 5, subLevel: 'L5.3', parent6SubLevel: 'L3.3', title: 'The Dream Team',                slug: 'the-dream-team',             focusSounds: ['ea','ie'],                                                              trickyWords: ['call','do','old'],               storyWords: [],                                                                  sortOrder: 53, isFreeSample: false },
  { level: 5, subLevel: 'L5.4', parent6SubLevel: 'L3.4', title: 'What Min Saw',                  slug: 'what-min-saw',               focusSounds: ['oi','aw'],                                                              trickyWords: ['was','so','what'],               storyWords: [],                                                                  sortOrder: 54, isFreeSample: false },
  { level: 5, subLevel: 'L5.5', parent6SubLevel: 'L3.5', title: 'The Boat with the Red Sail',    slug: 'the-boat-with-the-red-sail', focusSounds: ['ai','oa'],                                                              trickyWords: ['all','some','they'],             storyWords: [],                                                                  sortOrder: 55, isFreeSample: false },

  // ── L6 Building Fluency (was old L4) ────────────────────────
  { level: 6, subLevel: 'L6.1', parent6SubLevel: 'L4.1', title: 'The Purple Purse',              slug: 'the-purple-purse',           focusSounds: ['ur','er'],                                                              trickyWords: ['saw','watch','their'],           storyWords: [],                                                                  sortOrder: 61, isFreeSample: true  },
  { level: 6, subLevel: 'L6.2', parent6SubLevel: 'L4.2', title: 'The Brown Owl',                 slug: 'the-brown-owl',              focusSounds: ['are','ow'],                                                             trickyWords: ['where','were','small'],          storyWords: [],                                                                  sortOrder: 62, isFreeSample: false },
  { level: 6, subLevel: 'L6.3', parent6SubLevel: 'L4.3', title: 'The New Glue',                  slug: 'the-new-glue',               focusSounds: ['ew','ue'],                                                              trickyWords: ['school','who','brother'],        storyWords: [],                                                                  sortOrder: 63, isFreeSample: false },
  { level: 6, subLevel: 'L6.4', parent6SubLevel: 'L4.4', title: 'The Cheeky Monkey',             slug: 'the-cheeky-monkey',          focusSounds: ['ur','er','are','ow','ew','ue'],                                         trickyWords: ['any','tall','fall'],             storyWords: [],                                                                  sortOrder: 64, isFreeSample: false },

  // ── L7 Reading Together (was old L5) ────────────────────────
  { level: 7, subLevel: 'L7.1', parent6SubLevel: 'L5.1', title: 'Before the Shore',              slug: 'before-the-shore',           focusSounds: ['ire','ore'],                                                            trickyWords: ['does','could','would'],          storyWords: [],                                                                  sortOrder: 71, isFreeSample: true  },
  { level: 7, subLevel: 'L7.2', parent6SubLevel: 'L5.2', title: 'Near the Door',                 slug: 'near-the-door',              focusSounds: ['ear','oor'],                                                            trickyWords: ['anyone','over','through'],       storyWords: [],                                                                  sortOrder: 72, isFreeSample: false },
  { level: 7, subLevel: 'L7.3', parent6SubLevel: 'L5.3', title: 'Sure She Can!',                 slug: 'sure-she-can',               focusSounds: ['ure','tion'],                                                           trickyWords: ['once','whole','people'],         storyWords: [],                                                                  sortOrder: 73, isFreeSample: false },
  { level: 7, subLevel: 'L7.4', parent6SubLevel: 'L5.4', title: 'A Place for Me',                slug: 'a-place-for-me',             focusSounds: ['ire','ore','ear','oor','ure','tion'],                                   trickyWords: ['water','people','through'],      storyWords: [],                                                                  sortOrder: 74, isFreeSample: false },

  // ── L8 Reading Champion (was old L6) ────────────────────────
  { level: 8, subLevel: 'L8.1', parent6SubLevel: 'L6.1', title: 'The Marvellous Neighbourhood',  slug: 'the-marvellous-neighbourhood', focusSounds: ['-ous'],                                                                trickyWords: ['should','many','above'],         storyWords: [],                                                                  sortOrder: 81, isFreeSample: true  },
  { level: 8, subLevel: 'L8.2', parent6SubLevel: 'L6.2', title: 'You Are Remarkable',            slug: 'you-are-remarkable',         focusSounds: ['-able','-ible'],                                                        trickyWords: ['father','mother','great'],       storyWords: [],                                                                  sortOrder: 82, isFreeSample: false },
  { level: 8, subLevel: 'L8.3', parent6SubLevel: 'L6.3', title: 'It Looks Suspicious!',          slug: 'it-looks-suspicious',        focusSounds: ['-cious','-tious'],                                                      trickyWords: ['bought','caught','thought'],     storyWords: [],                                                                  sortOrder: 83, isFreeSample: false },
  { level: 8, subLevel: 'L8.4', parent6SubLevel: 'L6.4', title: 'The Incredible Bush Walk',      slug: 'the-incredible-bush-walk',   focusSounds: ['-ous','-able','-ible','-cious','-tious'],                               trickyWords: ['everyone','walk','talk'],        storyWords: [],                                                                  sortOrder: 84, isFreeSample: false },
];

export function getSchoolBooksByLevel(level: number): SchoolBook[] {
  return SCHOOL_BOOKS.filter((b) => b.level === level);
}
