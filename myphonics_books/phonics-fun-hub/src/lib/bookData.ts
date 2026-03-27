import { Book, QuizQuestion } from './types';

export const LEVEL_1_BOOKS: Book[] = [
  {
    id: 'l1-1', level: 1, subLevel: 'L1.1', title: 'Tap! Tap! Tap!', slug: 'tap-tap-tap',
    focusSounds: ['s', 'a', 't', 'p', 'i', 'n'], trickyWords: ['the', 'I'], storyWords: ['tap', 'sit', 'pan', 'pin', 'nap', 'tin'],
    pageCount: 12, sortOrder: 1, unlocked: true, completed: false, lastPageRead: 0,
    pages: [
      { id: 'l1-1-p1', pageNumber: 1, pageType: 'cover', textContent: 'Tap! Tap! Tap!' },
      { id: 'l1-1-p2', pageNumber: 2, pageType: 'guide', textContent: 'Before reading: Look at the cover together. Ask your child what they think the story is about.\n\nDuring reading: Point to each word as your child reads. Help them sound out any tricky words.\n\nAfter reading: Talk about what happened in the story. Can your child retell it in their own words?' },
      { id: 'l1-1-p3', pageNumber: 3, pageType: 'reference', textContent: 'Focus sounds: s, a, t, p, i, n' },
      { id: 'l1-1-p4', pageNumber: 4, pageType: 'story', textContent: 'I can tap.\nTap, tap, tap!' },
      { id: 'l1-1-p5', pageNumber: 5, pageType: 'story', textContent: 'I can sit.\nSit and tap!' },
      { id: 'l1-1-p6', pageNumber: 6, pageType: 'story', textContent: 'I can nap.\nNap, nap, nap.' },
      { id: 'l1-1-p7', pageNumber: 7, pageType: 'story', textContent: 'I can spin.\nSpin and tap!' },
      { id: 'l1-1-p8', pageNumber: 8, pageType: 'story', textContent: 'I can pat.\nPat, pat, pat!' },
      { id: 'l1-1-p9', pageNumber: 9, pageType: 'story', textContent: 'Tap! Tap! Tap!\nI can do it all!' },
      { id: 'l1-1-p10', pageNumber: 10, pageType: 'certificate', textContent: 'Reading Star Certificate' },
      { id: 'l1-1-p11', pageNumber: 11, pageType: 'back_cover', textContent: 'MyPhonicsBooks — Level 1: Starting Stories' },
    ],
  },
  {
    id: 'l1-2', level: 1, subLevel: 'L1.2', title: 'The Mud on the Dog', slug: 'the-mud-on-the-dog',
    focusSounds: ['m', 'd', 'g', 'o'], trickyWords: ['the', 'no'], storyWords: ['mud', 'dog', 'mop', 'got', 'dig', 'mom'],
    pageCount: 12, sortOrder: 2, unlocked: true, completed: false, lastPageRead: 0,
    pages: [
      { id: 'l1-2-p1', pageNumber: 1, pageType: 'cover', textContent: 'The Mud on the Dog' },
      { id: 'l1-2-p2', pageNumber: 2, pageType: 'guide', textContent: 'Before reading: Look at the cover. What can your child see?\n\nDuring reading: Encourage your child to sound out each word.\n\nAfter reading: Did the dog like the mud?' },
      { id: 'l1-2-p3', pageNumber: 3, pageType: 'reference', textContent: 'Focus sounds: m, d, g, o' },
      { id: 'l1-2-p4', pageNumber: 4, pageType: 'story', textContent: 'The dog got mud.\nMud on the dog!' },
      { id: 'l1-2-p5', pageNumber: 5, pageType: 'story', textContent: 'The dog did dig.\nDig, dig, dig!' },
      { id: 'l1-2-p6', pageNumber: 6, pageType: 'story', textContent: 'Mud on the mat.\nNo, dog, no!' },
      { id: 'l1-2-p7', pageNumber: 7, pageType: 'story', textContent: 'Mum got the mop.\nMop, mop, mop!' },
      { id: 'l1-2-p8', pageNumber: 8, pageType: 'story', textContent: 'No mud on the dog.\nGood dog!' },
      { id: 'l1-2-p9', pageNumber: 9, pageType: 'certificate', textContent: 'Reading Star Certificate' },
      { id: 'l1-2-p10', pageNumber: 10, pageType: 'back_cover', textContent: 'MyPhonicsBooks — Level 1: Starting Stories' },
    ],
  },
  {
    id: 'l1-3', level: 1, subLevel: 'L1.3', title: 'The Fish in the Tank', slug: 'the-fish-in-the-tank',
    focusSounds: ['sh', 'nk'], trickyWords: ['the', 'I', 'to'], storyWords: ['fish', 'tank', 'ship', 'shin', 'sink', 'pink'],
    pageCount: 12, sortOrder: 3, unlocked: false, completed: false, lastPageRead: 0,
    pages: [
      { id: 'l1-3-p1', pageNumber: 1, pageType: 'cover', textContent: 'The Fish in the Tank' },
      { id: 'l1-3-p2', pageNumber: 2, pageType: 'guide', textContent: 'This book introduces the digraphs sh and nk.' },
      { id: 'l1-3-p3', pageNumber: 3, pageType: 'reference', textContent: 'Focus sounds: sh, nk' },
      { id: 'l1-3-p4', pageNumber: 4, pageType: 'story', textContent: 'The fish is in the tank.\nA big pink fish!' },
      { id: 'l1-3-p5', pageNumber: 5, pageType: 'story', textContent: 'The fish can sink.\nSink to the bottom.' },
      { id: 'l1-3-p6', pageNumber: 6, pageType: 'story', textContent: 'I can see the fish.\nShh! Do not tap!' },
      { id: 'l1-3-p7', pageNumber: 7, pageType: 'certificate', textContent: 'Reading Star Certificate' },
    ],
  },
  {
    id: 'l1-4', level: 1, subLevel: 'L1.4', title: 'The Red Socks', slug: 'the-red-socks',
    focusSounds: ['c', 'k', 'ck', 'e'], trickyWords: ['the', 'my'], storyWords: ['red', 'sock', 'kick', 'neck', 'peck', 'deck'],
    pageCount: 12, sortOrder: 4, unlocked: false, completed: false, lastPageRead: 0,
    pages: [{ id: 'l1-4-p1', pageNumber: 1, pageType: 'cover', textContent: 'The Red Socks' }],
  },
  {
    id: 'l1-5', level: 1, subLevel: 'L1.5', title: 'Run, Pup, Run!', slug: 'run-pup-run',
    focusSounds: ['u', 'r', 'h', 'b'], trickyWords: ['the', 'go'], storyWords: ['run', 'pup', 'hug', 'bus', 'rub', 'hub'],
    pageCount: 12, sortOrder: 5, unlocked: false, completed: false, lastPageRead: 0,
    pages: [{ id: 'l1-5-p1', pageNumber: 1, pageType: 'cover', textContent: 'Run, Pup, Run!' }],
  },
  {
    id: 'l1-6', level: 1, subLevel: 'L1.6', title: 'Fox Fell Off!', slug: 'fox-fell-off',
    focusSounds: ['f', 'l', 'ff', 'll'], trickyWords: ['he', 'she'], storyWords: ['fox', 'fell', 'off', 'fill', 'flap', 'hill'],
    pageCount: 12, sortOrder: 6, unlocked: false, completed: false, lastPageRead: 0,
    pages: [{ id: 'l1-6-p1', pageNumber: 1, pageType: 'cover', textContent: 'Fox Fell Off!' }],
  },
  {
    id: 'l1-7', level: 1, subLevel: 'L1.7', title: 'The Jam Jug', slug: 'the-jam-jug',
    focusSounds: ['j', 'v', 'w'], trickyWords: ['was', 'you'], storyWords: ['jam', 'jug', 'van', 'vet', 'win', 'web'],
    pageCount: 12, sortOrder: 7, unlocked: false, completed: false, lastPageRead: 0,
    pages: [{ id: 'l1-7-p1', pageNumber: 1, pageType: 'cover', textContent: 'The Jam Jug' }],
  },
  {
    id: 'l1-8', level: 1, subLevel: 'L1.8', title: 'The Yak and the Box', slug: 'the-yak-and-the-box',
    focusSounds: ['x', 'y', 'z'], trickyWords: ['they', 'all'], storyWords: ['yak', 'box', 'fox', 'zip', 'mix', 'zap'],
    pageCount: 12, sortOrder: 8, unlocked: false, completed: false, lastPageRead: 0,
    pages: [{ id: 'l1-8-p1', pageNumber: 1, pageType: 'cover', textContent: 'The Yak and the Box' }],
  },
  {
    id: 'l1-9', level: 1, subLevel: 'L1.9', title: 'Chop, Chop, Chop!', slug: 'chop-chop-chop',
    focusSounds: ['ch', 'th'], trickyWords: ['are', 'her'], storyWords: ['chop', 'chip', 'thin', 'this', 'that', 'chat'],
    pageCount: 12, sortOrder: 9, unlocked: false, completed: false, lastPageRead: 0,
    pages: [{ id: 'l1-9-p1', pageNumber: 1, pageType: 'cover', textContent: 'Chop, Chop, Chop!' }],
  },
  {
    id: 'l1-10', level: 1, subLevel: 'L1.10', title: 'Buzz and Sing!', slug: 'buzz-and-sing',
    focusSounds: ['ng', 'qu', 'ss', 'zz'], trickyWords: ['said', 'have'], storyWords: ['buzz', 'sing', 'ring', 'queen', 'quiz', 'miss'],
    pageCount: 12, sortOrder: 10, unlocked: false, completed: false, lastPageRead: 0,
    pages: [{ id: 'l1-10-p1', pageNumber: 1, pageType: 'cover', textContent: 'Buzz and Sing!' }],
  },
];

export const SAMPLE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1', bookId: 'l1-1', quizType: 'comprehension', questionText: 'What can I do?',
    options: ['Tap', 'Run', 'Swim'], correctAnswer: 'Tap', sortOrder: 1,
  },
  {
    id: 'q2', bookId: 'l1-1', quizType: 'comprehension', questionText: 'What did I do after tapping?',
    options: ['Sit', 'Jump', 'Eat'], correctAnswer: 'Sit', sortOrder: 2,
  },
  {
    id: 'q3', bookId: 'l1-1', quizType: 'comprehension', questionText: 'What happens at the end?',
    options: ['I can do it all!', 'I fell asleep', 'I went home'], correctAnswer: 'I can do it all!', sortOrder: 3,
  },
  {
    id: 'q4', bookId: 'l1-2', quizType: 'comprehension', questionText: 'What did the dog get on the mat?',
    options: ['Mud', 'Paint', 'Water'], correctAnswer: 'Mud', sortOrder: 1,
  },
  {
    id: 'q5', bookId: 'l1-2', quizType: 'comprehension', questionText: 'Who cleaned up the mud?',
    options: ['Mum', 'Dad', 'The dog'], correctAnswer: 'Mum', sortOrder: 2,
  },
  {
    id: 'q6', bookId: 'l1-2', quizType: 'comprehension', questionText: 'What did the dog do in the garden?',
    options: ['Dig', 'Sleep', 'Eat'], correctAnswer: 'Dig', sortOrder: 3,
  },
];

export const ASSESSMENT_SOUNDS = [
  { grapheme: 's', level: 1 }, { grapheme: 'a', level: 1 }, { grapheme: 't', level: 1 },
  { grapheme: 'p', level: 1 }, { grapheme: 'i', level: 1 }, { grapheme: 'n', level: 1 },
  { grapheme: 'm', level: 1 }, { grapheme: 'd', level: 1 }, { grapheme: 'sh', level: 1 },
  { grapheme: 'ch', level: 1 }, { grapheme: 'th', level: 1 }, { grapheme: 'ng', level: 1 },
  { grapheme: 'ai', level: 2 }, { grapheme: 'ee', level: 2 }, { grapheme: 'oa', level: 2 },
  { grapheme: 'oo', level: 2 },
];

export const ASSESSMENT_WORDS = [
  { word: 'sit', level: 1 }, { word: 'tap', level: 1 }, { word: 'dog', level: 1 },
  { word: 'fish', level: 1 }, { word: 'ship', level: 1 }, { word: 'chop', level: 1 },
  { word: 'rain', level: 2 }, { word: 'feet', level: 2 }, { word: 'goat', level: 2 },
  { word: 'moon', level: 2 },
];

export const ASSESSMENT_TRICKY_WORDS = [
  { word: 'the', level: 1 }, { word: 'I', level: 1 }, { word: 'no', level: 1 },
  { word: 'go', level: 1 }, { word: 'to', level: 1 }, { word: 'he', level: 1 },
  { word: 'she', level: 1 }, { word: 'said', level: 2 },
];
