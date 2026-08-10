// ---------------------------------------------------------------------------
// L8 WORKBOOK — Reading Champion (Teal). Four books; suffix morphology and
// the longest sentences in the scheme. All sentences are VERBATIM book text;
// words come from the books' word lists + the L8 tricky words. Grammar per
// the master plan: B1 8.3 · B2 8.4 + 8.2 · B3 8.6 + 8.1 · B4 8.5 + revisit.
// ---------------------------------------------------------------------------

import type { W2LevelData, W2BookData } from '@/data/workbook2/levels';
import { W2_LEVEL_SPECS } from '@/data/workbook2/levels';

const PROMPT = 'Look at this moment from the book. Write what happens next.';

const BOOKS: W2BookData[] = [
  {
    num: 1,
    title: 'The Marvellous Neighbourhood',
    spellPractise: ['famous', 'marvellous', 'enormous', 'glorious', 'fabulous', 'joyous'],
    grammar: ['g-l8-3'],
    hold: [
      'An enormous cloud of warm bread smell drifted out through the open door.',
      'Uncle Tarek smiled and handed Yusuf a small notebook and a pen.',
    ],
    listen: ['The Enormous Nile.', 'The Famous Bakery.'],
    questions: [
      'What did Uncle Tarek give Yusuf at the end?',
      'Why do you think Yusuf changed his mind about his neighbourhood?',
      'Write one sentence to sum up what Uncle Tarek taught Yusuf.',
    ],
    useGrammar: { chips: ['famous', 'enormous', 'glorious', 'joyous', 'marvellous'], scene: '/storyart/l8_1/page5.png', pos: '50% 45%' },
    bigWrite: { prompt: PROMPT, scene: '/storyart/l8_1/page6.png', pos: '50% 45%' },
    ladders: [
      { sound: 'ous', word: 'famous', sentence: 'The Famous Bakery.' },
      { sound: 'ous', word: 'glorious', sentence: 'The Glorious Minaret.' },
    ],
  },
  {
    num: 2,
    title: 'You Are Remarkable',
    spellPractise: ['sensible', 'possible', 'terrible', 'visible', 'incredible', 'responsible'],
    grammar: ['g-l8-4', 'g-l8-2'],
    hold: [
      'She did not give up.',
      'He stopped crying and leaned against her shoulder.',
    ],
    listen: ['She stopped.', 'His family is searching for him.'],
    questions: [
      "What did the girl write on her note to help find the boy's family?",
      'Why do you think the girl did not give up looking for the family?',
      'Write one sentence to sum up what happened in this story.',
    ],
    useGrammar: { chips: ['sensible', 'possible', 'terrible', 'visible', 'incredible'], scene: '/storyart/l8_2/page3.png', pos: '50% 45%' },
    revisit: [
      { kind: 'rewrite', label: 'Change the opener', refs: [{ sourceUnit: 'G-L8.4', rowRef: 1 }, { sourceUnit: 'G-L8.4', rowRef: 3 }] },
      { kind: 'rewrite', label: 'Punctuate the speech', refs: [{ sourceUnit: 'G-L8.2', rowRef: 0 }, { sourceUnit: 'G-L8.2', rowRef: 2 }] },
    ],
    bigWrite: {
      prompt: 'Number the pictures 1 to 4 in story order. Then write the story. Start a sentence with a fronted adverbial.',
      scene: '/storyart/l8_2/page6.png',
      scenes: [
        { src: '/storyart/l8_2/page5.png' },
        { src: '/storyart/l8_2/page1.png' },
        { src: '/storyart/l8_2/page8.png' },
        { src: '/storyart/l8_2/page3.png' },
      ],
    },
    ladders: [
      { sound: 'ible', word: 'incredible', sentence: 'She stopped.' },
      { sound: 'able', word: 'predictable', sentence: 'She did not give up.' },
    ],
  },
  {
    num: 3,
    title: 'It Looks Suspicious!',
    spellPractise: ['delicious', 'suspicious', 'precious', 'cautious', 'nutritious', 'gracious'],
    grammar: ['g-l8-6', 'g-l8-1'],
    hold: ['He took the tiniest bite.', 'His eyes went wide.'],
    listen: ['Luca sniffed.', 'Nonna just smiled.'],
    questions: [
      'What three dishes did Nonna make for Luca?',
      'Why do you think Sofia said the granita looked suspicious, just like Luca did?',
      "Write one sentence to sum up what Luca learned about Nonna's cooking.",
    ],
    useGrammar: { chips: ['delicious', 'suspicious', 'cautious', 'precious', 'scrumptious'], scene: '/storyart/l8_3/page3.png', pos: '50% 50%' },
    revisit: [
      { kind: 'rewrite', label: 'Be a proofreader', refs: [{ sourceUnit: 'G-L8.6', rowRef: 1 }, { sourceUnit: 'G-L8.6', rowRef: 3 }] },
      { kind: 'rewrite', label: 'Make it a fronted adverbial', refs: [{ sourceUnit: 'G-L8.1', rowRef: 1 }, { sourceUnit: 'G-L8.1', rowRef: 2 }] },
    ],
    bigWrite: { prompt: PROMPT, scene: '/storyart/l8_3/page6.png', pos: '50% 45%' },
    ladders: [
      { sound: 'cious', word: 'delicious', sentence: 'It was delicious.' },
      { sound: 'tious', word: 'cautious', sentence: 'He took the tiniest bite.' },
    ],
  },
  {
    num: 4,
    title: 'The Incredible Bush Walk',
    spellPractise: ['incredible', 'enormous', 'cautious', 'gorgeous', 'remarkable', 'capable'],
    grammar: ['g-l8-5'],
    hold: ['Mia was ambitious.', 'He stopped walking and listened.'],
    listen: ['Mia smiled.', 'Today was an incredible bush walk.'],
    questions: [
      'What amazing bird did Tom find hiding behind a fern?',
      "Why do you think Mia said Tom was 'admirable' by the end of the walk?",
      'Write one sentence to sum up what Mia learned from Tom on the walk.',
    ],
    useGrammar: { chips: ['incredible', 'enormous', 'cautious', 'remarkable', 'glorious'], scene: '/storyart/l8_4/page2.png', pos: '50% 50%' },
    revisit: [
      { kind: 'tick', label: 'One owner or more than one?', refs: [{ sourceUnit: 'G-L8.3', rowRef: 0 }, { sourceUnit: 'G-L8.3', rowRef: 1 }] },
      { kind: 'rewrite', label: 'Change the opener', refs: [{ sourceUnit: 'G-L8.4', rowRef: 0 }] },
      { kind: 'rewrite', label: 'Be a proofreader', refs: [{ sourceUnit: 'G-L8.6', rowRef: 0 }] },
    ],
    bigWrite: {
      prompt: 'Number the pictures 1 to 4 in story order. Then write the story. Start a sentence with a fronted adverbial.',
      scene: '/storyart/l8_4/page4.png',
      scenes: [
        { src: '/storyart/l8_4/page5.png' },
        { src: '/storyart/l8_4/page1.png' },
        { src: '/storyart/l8_4/page8.png' },
        { src: '/storyart/l8_4/page3.png' },
      ],
    },
    ladders: [
      { sound: 'ible', word: 'incredible', sentence: 'Mia was ambitious.' },
      { sound: 'ous', word: 'gorgeous', sentence: 'He stopped walking and listened.' },
    ],
  },
];

export const L8_DATA: W2LevelData = {
  spec: W2_LEVEL_SPECS[8],
  books: BOOKS,
  swykA: [
    { kind: 'tick', label: 'One owner or more than one?', refs: [{ sourceUnit: 'G-L8.3', rowRef: 2 }, { sourceUnit: 'G-L8.3', rowRef: 3 }, { sourceUnit: 'G-L8.3', rowRef: 4 }, { sourceUnit: 'G-L8.3', rowRef: 5 }] },
    { kind: 'rewrite', label: 'Change the opener', refs: [{ sourceUnit: 'G-L8.4', rowRef: 2 }] },
    { kind: 'rewrite', label: 'Punctuate the speech', refs: [{ sourceUnit: 'G-L8.2', rowRef: 1 }] },
    { kind: 'cloze', label: 'Choose the joining word', refs: [{ sourceUnit: 'G-L8.5', rowRef: 0 }, { sourceUnit: 'G-L8.5', rowRef: 3 }] },
  ],
  swykB: {
    groups: [
      { kind: 'rewrite', label: 'Make it a fronted adverbial', refs: [{ sourceUnit: 'G-L8.1', rowRef: 0 }] },
      { kind: 'rewrite', label: 'Be a proofreader', refs: [{ sourceUnit: 'G-L8.6', rowRef: 2 }] },
    ],
    writeTask: 'Write three sentences about the bush walk. Start one with a fronted adverbial.',
    writeLines: 3,
  },
  swykAnswers: 'one owner; more than one; one owner; more than one. In the sun, the cat slept. "It is hot," said Mum. After; When. After lunch, the dog barked in the park. The cat is on the mat.',
  spellings: [
    { title: 'The Marvellous Neighbourhood', words: ['famous', 'marvellous', 'enormous', 'glorious', 'fabulous', 'joyous', 'hour', 'move', 'sure', 'eye'] },
    { title: 'You Are Remarkable', words: ['sensible', 'possible', 'terrible', 'visible', 'incredible', 'responsible', 'should', 'would', 'who', 'many'] },
    { title: 'It Looks Suspicious!', words: ['delicious', 'suspicious', 'precious', 'cautious', 'nutritious', 'gracious', 'whole', 'clothes', 'busy', 'water'] },
    { title: 'The Incredible Bush Walk', words: ['incredible', 'enormous', 'cautious', 'gorgeous', 'remarkable', 'capable', 'again', 'half', 'money', 'parents'] },
    { title: 'Half-term test', words: ['famous', 'sensible', 'delicious', 'incredible', 'enormous', 'should', 'would', 'many', 'again', 'water'] },
  ],
  grownUps: [
    { title: 'Little and often', body: 'One page a day, about five minutes, after the day\'s reading or sound book. Never push on to a second page.' },
    { title: 'The order matters', body: 'Each book\'s pages run in teaching order: grammar, Sentences, Answer it, more grammar, Use your grammar, Spell it, Big write, then Handwriting in its own slot.' },
    { title: 'Spell it works twice', body: 'Practise the words the day before the test. On test day, cover the top half and read the words from the Spelling words page.' },
    { title: 'The first one is done', body: 'On grammar pages the first item is completed in colour. Talk it through together before the child does the rest.' },
    { title: 'Listen and write', body: 'Read the sentence aloud twice. The child says it back, taps a finger per word, then writes it. The sentences are in the Answers.' },
    { title: 'The big write is the win', body: 'The picture is the prompt. Expect paragraphs now: openers, joined ideas, careful end marks.' },
    { title: 'Handwriting', body: 'Fluent joined writing feeds the big write. Little and neat beats lots and rushed.' },
    { title: 'The last year of the scheme', body: 'Show what you know and the half-term test close the journey. Secure here means a confident, independent reader and writer.' },
  ],
};
