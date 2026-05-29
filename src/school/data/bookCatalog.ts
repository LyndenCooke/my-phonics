/**
 * 33-book catalogue for the school-8 structure.
 *
 * DISPLAY-ONLY SUMMARY. This file mirrors level/title/sub_level/focus_sounds
 * from the production storybook files (`myphonics_books/data/*_story_*.py`).
 * Tricky-word / story-word arrays are kept lean here for UI cards; the full
 * lists live in the per-book Python files. Treat the Python files as
 * authoritative when content disagrees.
 *
 * Mapping from production (parent-6) sub_levels per rwi_aligned_proposal.md
 * section 5. Titles are taken from the production catalogue verbatim.
 *
 * Canonical ID: `SB-L{level}.{n}` (e.g. SB-L4.1). One-digit `n` matches the
 * sub-level numbering used inside each level (L4 has storybooks 1-6).
 */

export interface SchoolBook {
  id: string;                // SB-L{level}.{n} — canonical, URL-safe
  level: number;
  subLevel: string;          // school-8 pedagogy ID, e.g. "L3.1"
  parent6SubLevel: string;   // original ID, e.g. "L1.3" — for looking up shipped PDF + interactive pages
  title: string;
  slug: string;
  focusSounds: string[];
  trickyWords: string[];
  storyWords: string[];
  sortOrder: number;
  isFreeSample: boolean;
}

const _RAW_BOOKS: Omit<SchoolBook, 'id'>[] = [
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
  { level: 6, subLevel: 'L6.2', parent6SubLevel: 'L4.2', title: 'The Brown Owl',                 slug: 'the-brown-owl',              focusSounds: ['are','ow (brown)'],                                                     trickyWords: ['where','were','small'],          storyWords: [],                                                                  sortOrder: 62, isFreeSample: false },
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

/**
 * Story content (story_words, tricky_words_used, read_words) extracted from
 * the per-book Python source files under `myphonics_books/data/*_story_*.py`.
 * Keyed by parent-6 sub-level. If a book file changes upstream, regenerate
 * via the extractor that produced `book_story_words_extracted.json`.
 */
interface StoryContent {
  storyWords: string[];
  trickyWordsUsed: string[];
  readWords?: string[];
}

const STORY_CONTENT_BY_PARENT6: Record<string, StoryContent> = {
  'L1.1':  { storyWords: ['sit','mat','tap','rat','bat','pat','cat','fat','naps'],                                 trickyWordsUsed: ['I','the'],                                                                                                                                       readWords: ['sat','pat','tap','nap'] },
  'L1.2':  { storyWords: ['dog','mud','mop','mum','mess','got','big','tub'],                                       trickyWordsUsed: ['I','the','no','me'],                                                                                                                             readWords: ['dog','mud','mop','mum'] },
  'L1.3':  { storyWords: ['fish','tank','wish','bag','cup','sad'],                                                  trickyWordsUsed: ['I','a','the','no','go','is'],                                                                                                                   readWords: ['fish','tank','wish','bag'] },
  'L1.4':  { storyWords: ['socks','check','red','bed','hen','pen','pecks','kick'],                                  trickyWordsUsed: ['I','the','no'],                                                                                                                                  readWords: ['sock','red','kick','peck'] },
  'L1.5':  { storyWords: ['run','pup','hut','bush','tub','rub','hug','hid'],                                        trickyWordsUsed: ['I','the'],                                                                                                                                       readWords: ['hub','rub','hut','bug'] },
  'L1.6':  { storyWords: ['fox','fell','off','log','rock','hill','slip','mat'],                                     trickyWordsUsed: ['I','the'],                                                                                                                                       readWords: ['fill','fell','huff','doll'] },
  'L1.7':  { storyWords: ['jam','jug','van','wet','win','rug','fig','dip','vat'],                                   trickyWordsUsed: ['I','the','no'],                                                                                                                                  readWords: ['jug','van','web','wig'] },
  'L1.8':  { storyWords: ['yak','box','six','zip','fix','fig','hut','set','top'],                                   trickyWordsUsed: ['I','the','no'],                                                                                                                                  readWords: ['fox','yak','zip','mix'] },
  'L1.9':  { storyWords: ['chop','chip','thin','thick','this','that','pan','hot','dip','dish'],                     trickyWordsUsed: ['I','the'],                                                                                                                                       readWords: ['chop','chin','this','that'] },
  'L1.10': { storyWords: ['buzz','sing','song','long','hiss','quick','log','bug','and'],                            trickyWordsUsed: ['I','the','no','go'],                                                                                                                             readWords: ['ring','buzz','hiss','king'] },
  'L2.1':  { storyWords: ['high','day','sigh','need','light','see','way','night','say','yay'],                      trickyWordsUsed: ['the','I'],                                                                                                                                       readWords: ['high','day','sigh','light','see','way','night'] },
  'L2.2':  { storyWords: ['zoo','cow','owl','moo','hoop','cool'],                                                    trickyWordsUsed: ['the','I','to','no','my','me','go'],                                                                                                              readWords: ['zoo','owl','cool','hoop'] },
  'L2.3':  { storyWords: ['farm','barn','corn','torch','dark','morning'],                                            trickyWordsUsed: ['the','I','we','go','to','my','her'],                                                                                                             readWords: ['farm','barn','torch','morning','dark','corn'] },
  'L2.4':  { storyWords: ['fair','air','pair','hair','sir','fir'],                                                   trickyWordsUsed: ['the','I','my','to','no','said','go','put','he'],                                                                                                 readWords: ['fair','pair','chair','fir'] },
  'L2.5':  { storyWords: ['around','loud','out','shouted','found','toy','joy','zoomed'],                             trickyWordsUsed: ['I','my','we','she','said','you','to','the','me','no'],                                                                                           readWords: ['out','shout','round','toy'] },
  'L2.6':  { storyWords: ['night','fair','cool','moon','drum','corn','bird','shout','way','day'],                    trickyWordsUsed: ['the','I','to','we','go','my','me','he'],                                                                                                         readWords: ['night','fair','shout','moon'] },
  'L3.1':  { storyWords: ['ride','bike','gate','lake','made','brave'],                                               trickyWordsUsed: ['the','I','to','my','she','said','me','go','what'],                                                                                               readWords: ['shine','prize','plate','flame','wave','pine'] },
  'L3.2':  { storyWords: ['close','huge','stone','bright','noodle'],                                                 trickyWordsUsed: ['the','to','I','was','we','me','you','are','so','go','she','said'],                                                                              readWords: ['close','spoke','huge','stone'] },
  'L3.3':  { storyWords: ['clean','team','reach','feast','tries','spies'],                                           trickyWordsUsed: ['the','to','I','she','her','we','he','your','me','go','one','said','what','are','so'],                                                            readWords: ['clean','team','reach','feast'] },
  'L3.4':  { storyWords: ['saw','hawk','claws','coin','soil','pointed','paw','jaw'],                                  trickyWordsUsed: ['the','I','her','no','all','to','want','said','she','he','are','so','they','was','what','you'],                                                  readWords: ['saw','hawk','claw','coin','soil','point'] },
  'L3.5':  { storyWords: ['rain','sail','snail','boat','coat','road'],                                               trickyWordsUsed: ['said','he','they','to','the','into','I'],                                                                                                         readWords: ['sail','snail','boat','coat'] },
  'L4.1':  { storyWords: ['purple','purse','turned','ferns','herbs','never'],                                        trickyWordsUsed: ['the','to','I','you','her','your','go','no','so','old','put','was','where','said','what','she','my'],                                              readWords: ['church','burst','seller','corner'] },
  'L4.2':  { storyWords: ['owl','stared','brown','dare','howl','care'],                                              trickyWordsUsed: ['the','to','I','we','my','go','me','her','saw','there','want','said','was','what','were','she','all'],                                            readWords: ['howl','bare','brown','stared'] },
  'L4.3':  { storyWords: ['glue','blue','new','drew','threw','grew'],                                                trickyWordsUsed: ['the','to','he','her','you','me','they','fall','said','was','she','all','so','into'],                                                              readWords: ['chewed','rescued','flew','true'] },
  'L4.4':  { storyWords: ['brown','furry','down','now','how','new'],                                                 trickyWordsUsed: ['they','he','what','into','she','there','so','said','was','the','to','I','her','you','where'],                                                     readWords: ['stare','turn','true','glow'] },
  'L5.1':  { storyWords: ['shore','stone','before','wire','more','fire'],                                            trickyWordsUsed: ['the','to','he','was','said','once','they','we','you','so','put','go','I','me','one','some','would'],                                              readWords: ['shore','stone','before','explore'] },
  'L5.2':  { storyWords: ['hear','near','door','floor','ear','dear','fear','clear','poor'],                          trickyWordsUsed: ['I','the','to','my','said','you','do','what','he','was','one','some','where','saw','there','were','eyes','into','could','heart'],                  readWords: ['hear','near','door','floor','dear','clear'] },
  'L5.3':  { storyWords: ['pure','instruction','attention','section','action','direction'],                          trickyWordsUsed: ['the','said','you','they','was','over','people','she','he','we','I','to','into','are','all','one','two','there','through','heart','again','her','done','eyes','want'], readWords: ['sure','pure','section','action'] },
  'L5.4':  { storyWords: ['shore','more','explore','door','fear','near','clear','pure','section','direction','attention','tired'], trickyWordsUsed: ['the','to','I','was','said','where','people','anyone','he','she','could','there','my','are','any','again','knew','sure'],                          readWords: ['shore','explore','section','direction','pure','attention'] },
  'L6.1':  { storyWords: ['marvellous','glorious','enormous','famous','fabulous','joyous'],                          trickyWordsUsed: ['the','said','my','you','all','whole','neighbourhood','so'],                                                                                       readWords: ['marvellous','enormous','glorious','fabulous'] },
  'L6.2':  { storyWords: ['sensible','possible','terrible','horrible','visible','incredible','responsible','predictable'], trickyWordsUsed: ['the','said','was','you','her','their','people','thought'],                                                                                    readWords: ['sensible','possible','terrible','incredible'] },
  'L6.3':  { storyWords: ['delicious','suspicious','cautious','precious','nutritious','scrumptious','gracious','ambitious'], trickyWordsUsed: ['the','said','was','you','what','do','could','ever','whole','people','love'],                                                                  readWords: ['delicious','suspicious','cautious','nutritious'] },
  'L6.4':  { storyWords: ['incredible','enormous','cautious','gorgeous','remarkable','precious','capable','glorious','famous','visible'], trickyWordsUsed: ['the','to','she','he','said','was','her','they','all','some','what','were','could','would','over','through','everyone','walk','brother','whole'], readWords: ['incredible','cautious','gorgeous','remarkable'] },
};

export const SCHOOL_BOOKS: SchoolBook[] = _RAW_BOOKS.map((b) => {
  const content = STORY_CONTENT_BY_PARENT6[b.parent6SubLevel];
  return {
    ...b,
    id: `SB-${b.subLevel}`,
    storyWords: content?.storyWords ?? b.storyWords,
    trickyWords: content?.trickyWordsUsed ?? b.trickyWords,
  };
});

export function getSchoolBooksByLevel(level: number): SchoolBook[] {
  return SCHOOL_BOOKS.filter((b) => b.level === level);
}

export function getSchoolBookById(id: string): SchoolBook | undefined {
  return SCHOOL_BOOKS.find((b) => b.id === id);
}
