import type { GrammarUnit, GrammarBookletMeta } from '@/data/grammarSchema';
import { TICKGRID_CATEGORIES } from '@/data/grammarSchema';

// ---------------------------------------------------------------------------
// L6 GRAMMAR BOOKLET — "Grammar · Level 6 · Building Fluency" (Indigo #6366F1).
// The Year 2 statutory grammar pack. Authored to v3 from grammar_L6_contents.md
// exactly: every unit, example, row, answer, apply sentence, decoration set and
// the booklet meta. No new decodable text is invented here; the review page
// reuses approved rows by pointer only.
//
// Anchor books: The Purple Purse (ur, er), The Brown Owl (are, ow), The New Glue
// (ew, ue), The Cheeky Monkey (review). Every sentence is decodable at L6 and
// sits in the L6 band (6–12 words). British English, no em dashes, no bold.
// ---------------------------------------------------------------------------

const COMMON = {
  level: 6,
  levelLabel: 'L6',
  strand: 'Grammar',
  levelSubtitle: 'Level 6 · Building Fluency',
} as const;

const units: GrammarUnit[] = [
  // ---- G-L6.1, Four kinds of sentence (tickgrid) — page 4 ----------------
  {
    ...COMMON,
    id: 'g-l6-1',
    code: 'G-L6.1',
    name: 'Four kinds of sentence',
    doInstruction: 'Tick the kind each sentence is',
    objective: 'Name and sort statement, question, command and exclamation.',
    ncLink: 'Year 2 · sentence types',
    terminology: ['statement', 'question', 'command', 'exclamation'],
    anchorBook: 'The Brown Owl',
    soundsRevisited: 'ow (owl, howl, down), are or ar (bare, branch, stared)',
    // The tickgrid (six rows + the terminology note) is too tall for a foot band,
    // so the owl-on-branch scene sits in the reserved apply rail, and the check
    // device is omitted to keep one page.
    illustration: { pattern: 'applyRail', assets: ['scene_owl_branch'], relatesTo: 'the owl on the bare branch beside the apply lines, from "The owl sat on a bare branch"' },
    watchArt: ['leaf', 'branch'],
    s1: {
      prompt: 'How high the brown owl flew!',
      answer: 'Exclamation',
      exampleLayout: 'inline',
      note: 'An exclamation starts with What or How, has a subject and a verb, and ends on an action word.',
    },
    weDoCount: 2,
    apply: { prompt: 'Now you write a command about the owl.' },
    format: 'tickgrid',
    tickgrid: {
      columns: [...TICKGRID_CATEGORIES],
      categories: TICKGRID_CATEGORIES,
      rows: [
        { text: 'The owl sat on a bare branch.', answer: 'Statement' },
        { text: 'What was that noise?', answer: 'Question' },
        { text: 'Look up at the tree!', answer: 'Command' },
        { text: 'What a loud howl the owl made!', answer: 'Exclamation' },
        { text: 'The owl stared down at me.', answer: 'Statement' },
        { text: 'Can we go and look?', answer: 'Question' },
      ],
    },
  },

  // ---- G-L6.2, Make the noun phrase grow (build) — page 5 ----------------
  {
    ...COMMON,
    id: 'g-l6-2',
    code: 'G-L6.2',
    name: 'Make the noun phrase grow',
    doInstruction: 'Write each noun phrase again, grown bigger',
    objective: 'Expand a noun phrase with adjectives.',
    ncLink: 'Year 2 · expanded noun phrases',
    terminology: ['noun', 'adjective', 'noun phrase'],
    anchorBook: 'The New Glue · The Purple Purse · The Brown Owl',
    soundsRevisited: 'ew or ue (new, blue, glue), ur (purse, purple), ow (owl, brown), are (bare)',
    illustration: { pattern: 'rowArt', assets: ['glue', 'purse', 'branch', 'owlets'], relatesTo: 'each row gets its object: glue, purse, branch, owlets' },
    rowArt: ['glue', 'purse', 'branch', 'owlets'],
    watchArt: ['owl'],
    check: { items: ['capitalLetter', 'fingerSpaces', 'fullStop'] },
    // Comma between the two adjectives per Lynden's amendment 2026-06-12
    // (Y2 convention for expanded noun phrases).
    s1: { prompt: 'the owl', answer: 'the big, brown owl', exampleLayout: 'inline' },
    weDoCount: 1,
    apply: { prompt: 'Now you write a big noun phrase about an owl.' },
    format: 'build',
    build: {
      wordBank: ['brown', 'new', 'blue', 'bare', 'soft', 'fluffy', 'big', 'purple'],
      rowWriteLines: 1,
      rows: [
        { base: 'the glue', answer: 'the new, blue glue', icon: 'glue' },
        { base: 'the purse', answer: 'the soft, purple purse', icon: 'purse' },
        { base: 'the branch', answer: 'the bare, brown branch', icon: 'branch' },
        { base: 'the owlets', answer: 'the soft, fluffy owlets', icon: 'owlets' },
      ],
    },
  },

  // ---- G-L6.3, Joining with and, but, or, so (cloze) — page 6 ------------
  {
    ...COMMON,
    id: 'g-l6-3',
    code: 'G-L6.3',
    name: 'Joining with and, but, or, so',
    doInstruction: 'Write the best joining word in each gap',
    objective: 'Choose the joining word that links two ideas.',
    ncLink: 'Year 2 · co-ordination',
    terminology: ['joining word', 'conjunction'],
    anchorBook: 'The New Glue',
    soundsRevisited: 'ew or ue (glue), general L6',
    // The cup-rug-glue still life (one pre-composed scene from this page's own
    // sentences) sits in the reserved apply rail.
    illustration: {
      pattern: 'applyRail',
      assets: ['scene_cup_rug_glue'],
      relatesTo: 'the tipped cup on the rug with the glue beside it, from "The cup fell so the tea ran on the rug" and the glue sentences',
    },
    s1: { prompt: 'He turned to look ___ he did not see the patch.', answer: 'but', exampleLayout: 'inline' },
    weDoCount: 1,
    apply: { prompt: 'Now you write a sentence using so.' },
    format: 'cloze',
    cloze: {
      wordBank: ['and', 'but', 'or', 'so'],
      rows: [
        { before: 'The glue was wet', after: 'it stuck to her hand.', answer: 'so' },
        { before: 'She drew a bird', after: 'she gave it to Mum.', answer: 'and' },
        { before: 'We can use glue', after: 'we can use tape.', answer: 'or' },
        { before: 'The cup fell', after: 'the tea ran on the rug.', answer: 'so' },
      ],
    },
  },

  // ---- G-L6.4, Joining with when, if, that, because (cloze) — page 7 -----
  {
    ...COMMON,
    id: 'g-l6-4',
    code: 'G-L6.4',
    name: 'Joining with when, if, that, because',
    doInstruction: 'Write the best joining word in each gap',
    objective: 'Choose the joining word that links a main and a sub idea.',
    ncLink: 'Year 2 · subordination',
    terminology: ['joining word', 'conjunction'],
    anchorBook: 'The Brown Owl · The Purple Purse',
    soundsRevisited: 'ow (owl), ur (purse), general L6',
    // the owl-family scene (one pre-composed moment) fills the reserved foot
    // band. No check device on a foot-band page.
    illustration: {
      pattern: 'footScene',
      assets: ['scene_owl_owlets_moon'],
      relatesTo: 'the owl and two owlets together on the branch under the small moon, from "The owlets cheep" and "We set off when it got dark"',
    },
    watchArt: ['purse'],
    s1: { prompt: 'I was glad ___ I found my purse.', answer: 'because', exampleLayout: 'inline' },
    weDoCount: 1,
    apply: { prompt: 'Now you write a sentence using because.' },
    format: 'cloze',
    cloze: {
      wordBank: ['when', 'if', 'that', 'because'],
      rows: [
        { before: 'We can see the owl', after: 'we stay still.', answer: 'if' },
        { before: 'I think', after: 'the owl is rare.', answer: 'that' },
        { before: 'The owlets cheep', after: 'they want food.', answer: 'because' },
        { before: 'We set off', after: 'it got dark.', answer: 'when' },
      ],
    },
  },

  // ---- G-L6.5, Adjectives and adverbs (circle) — page 8 ------------------
  {
    ...COMMON,
    id: 'g-l6-5',
    code: 'G-L6.5',
    name: 'Adjectives and adverbs',
    doInstruction: 'Circle the adjective. Underline the adverb.',
    objective: 'Spot the adjective and the adverb in a sentence.',
    ncLink: 'Year 2 · adjectives and adverbs',
    terminology: ['adjective', 'adverb'],
    anchorBook: 'The Brown Owl · The New Glue · The Purple Purse',
    soundsRevisited: 'ow (owl, brown), ew or ue (new, glue), ur (purple, purse)',
    illustration: { pattern: 'applyRail', assets: ['cat'], relatesTo: 'the cross cat facing the writing, from "The cross cat ran off quickly"' },
    check: { items: ['capitalLetter', 'fingerSpaces', 'fullStop'] },
    // For circle, s1.answer names the words to mark: adjective / adverb.
    s1: { prompt: 'The brown owl flew quickly.', answer: 'brown / quickly' },
    weDoCount: 1,
    apply: { prompt: 'Now you write a sentence with an adjective and an adverb.' },
    format: 'circle',
    circle: {
      targets: [
        { label: 'adjective', mark: 'circle' },
        { label: 'adverb', mark: 'underline' },
      ],
      rows: [
        { text: 'The bare branch swayed gently.', finds: [{ word: 'bare', target: 'adjective' }, { word: 'gently', target: 'adverb' }] },
        { text: 'The new glue stuck fast.', finds: [{ word: 'new', target: 'adjective' }, { word: 'fast', target: 'adverb' }] },
        { text: 'The purple purse sat safely in her bag.', finds: [{ word: 'purple', target: 'adjective' }, { word: 'safely', target: 'adverb' }] },
        { text: 'The cross cat ran off quickly.', finds: [{ word: 'cross', target: 'adjective' }, { word: 'quickly', target: 'adverb' }] },
      ],
    },
  },

  // ---- G-L6.6, Apostrophes for contractions (match) — page 9 ------------
  {
    ...COMMON,
    id: 'g-l6-6',
    code: 'G-L6.6',
    name: 'Apostrophes for contractions',
    doInstruction: 'Draw a line to join each pair to its short form',
    objective: 'Join a pair of words to its contracted form.',
    ncLink: 'Year 2 · apostrophe for contraction',
    terminology: ['contraction', 'apostrophe'],
    anchorBook: 'general L6',
    soundsRevisited: 'general L6',
    // a book character anchored beside the apply lines: the Brown Owl girl —
    // the apply task is about the owl from her book.
    illustration: { pattern: 'applyRail', assets: ['hero_owl_standing'], relatesTo: 'the Brown Owl girl beside the apply lines; the apply task writes about her owl' },
    check: { items: ['capitalLetter', 'fingerSpaces', 'fullStop'] },
    s1: { prompt: 'do not', answer: "don't", exampleLayout: 'inline' },
    weDoCount: 1,
    apply: { prompt: "Now you write a sentence using it's about the owl." },
    format: 'match',
    match: {
      pairs: [
        { left: 'I am', right: "I'm" },
        { left: 'it is', right: "it's" },
        { left: 'did not', right: "didn't" },
        { left: 'we are', right: "we're" },
        { left: 'can not', right: "can't" },
      ],
      rightShuffled: ["didn't", "can't", "it's", "we're", "I'm"],
    },
  },

  // ---- G-L6.7, Keep the tense the same (rewrite) — page 10 ---------------
  {
    ...COMMON,
    id: 'g-l6-7',
    code: 'G-L6.7',
    name: 'Keep the tense the same',
    doInstruction: 'Rewrite each one all in the past tense',
    objective: 'Rewrite a sentence so every verb is in the past tense.',
    ncLink: 'Year 2 · consistent past tense',
    terminology: ['verb', 'past tense'],
    anchorBook: 'The Purple Purse',
    soundsRevisited: 'ur (purse), general L6',
    // No check device here: the rewrite page is the tight one for L6. The rail
    // is structural, so the cat fits without ever touching the lines.
    illustration: { pattern: 'applyRail', assets: ['cat'], relatesTo: 'the cat beside the apply lines, from "The card flew off and stuck to the cat"' },
    s1: {
      prompt: 'I turn out my pockets and found my purse.',
      answer: 'I turned out my pockets and found my purse.',
      exampleLayout: 'stacked',
    },
    weDoCount: 1,
    apply: { prompt: 'Now you write what happened next in the past tense.', lines: 2 },
    format: 'rewrite',
    rewrite: {
      rowWriteLines: 2,
      rows: [
        { text: 'The card flew off and stick to the cat.', answer: 'The card flew off and stuck to the cat.' },
        { text: 'The cat grew cross and run off.', answer: 'The cat grew cross and ran off.' },
        { text: 'She drew a bird and give it to Mum.', answer: 'She drew a bird and gave it to Mum.' },
        { text: 'Dad turned to look and slips over.', answer: 'Dad turned to look and slipped over.' },
      ],
    },
  },

  // ---- Review, Show what you know — page 11 ------------------------------
  {
    ...COMMON,
    id: 'g-l6-review',
    code: 'G-L6.R',
    name: 'Show what you know',
    doInstruction: 'Show what you know. Do one of each.',
    objective: 'Recap every skill from this pack.',
    ncLink: 'Year 2 · review',
    terminology: [],
    anchorBook: 'The Cheeky Monkey',
    soundsRevisited: 'general L6',
    // The review scene (the cheeky monkey on the wall with the stolen snack, a
    // real moment from the anchor book) sits in the reserved apply rail.
    illustration: {
      pattern: 'applyRail',
      assets: ['scene_review'],
      relatesTo: 'the cheeky monkey on the wall eating the stolen snack, from The Cheeky Monkey',
    },
    check: { items: ['capitalLetter', 'fingerSpaces', 'fullStop'] },
    // The review has no worked example; FlowyLayout skips the Watch-first box.
    s1: { prompt: 'Show what you know.', answer: '' },
    weDoCount: 0,
    apply: { prompt: 'Now you write a sentence about the owl with a joining word.' },
    format: 'review',
    review: {
      items: [
        { sourceUnit: 'G-L6.1', task: 'Tick the kind', rowRef: 3, answer: 'Exclamation' },
        { sourceUnit: 'G-L6.2', task: 'Grow the noun phrase', rowRef: 1, answer: 'the soft, purple purse' },
        { sourceUnit: 'G-L6.3', task: 'Choose the joining word', rowRef: 2, answer: 'or' },
        { sourceUnit: 'G-L6.5', task: 'Circle and underline', rowRef: 1, answer: 'new and fast' },
        { sourceUnit: 'G-L6.6', task: 'Match the short form', rowRef: 2, answer: "didn't" },
        { sourceUnit: 'G-L6.7', task: 'Rewrite in the past', rowRef: 1, answer: 'ran' },
      ],
    },
  },
];

// Front and back matter for the L6 booklet (cover, contents, how-to, answers).
// The booklet ends on Answers — no certificate page. Reused copy is swapped per
// level in grammar_level_content_template.
export const bookletMeta: GrammarBookletMeta = {
  level: 6,
  levelLabel: 'Building Fluency',
  coverSkills: ['sentences', 'noun phrases', 'joining words', 'tense'],
  howTo: [
    { title: 'I do. Watch first.', body: 'The grown-up reads the worked example and says how it works.' },
    { title: 'We do. Do the first one together.', body: 'Talk about the answer before writing.' },
    { title: 'You do.', body: 'The child finishes the rest, then writes their own at the foot.' },
  ],
  howToClosing: 'Say it. Tap it. Write it. Check it.',
  howToNote: 'Every sentence is decodable at Level 6 and ties to the Level 6 books.',
  reviewUnitId: 'g-l6-review',
};

export default units;
