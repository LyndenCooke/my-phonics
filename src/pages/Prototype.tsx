/**
 * Prototype page — interactive book demo with book selector.
 * Access via /prototype — does NOT affect the main app.
 */
import { useState } from 'react';
import InteractiveBookReader from '@/components/InteractiveBookReader';
import { useNavigate } from 'react-router-dom';
import type { Book } from '@/lib/types';
import { INTERACTIVE_BOOKS } from '@/lib/interactiveBookData';

const DEMO_BOOKS: Book[] = [
  // ── Level 1 ──
  {
    id: 'prototype-l1-1', level: 1, subLevel: 'L1.1', title: 'Tap! Tap! Tap!',
    slug: 'tap-tap-tap', focusSounds: ['s', 'a', 't', 'p', 'i', 'n'],
    trickyWords: ['the', 'I', 'a', 'is'], storyWords: [], pageCount: 24,
    sortOrder: 11, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l1-2', level: 1, subLevel: 'L1.2', title: 'The Mud on the Dog',
    slug: 'mud-on-the-dog', focusSounds: ['m', 'd', 'g', 'o'],
    trickyWords: ['the', 'I', 'a', 'is', 'no'], storyWords: [], pageCount: 24,
    sortOrder: 12, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l1-3', level: 1, subLevel: 'L1.3', title: 'The Fish in the Tank',
    slug: 'fish-in-the-tank', focusSounds: ['sh', 'nk'],
    trickyWords: ['the', 'I', 'a', 'is', 'no', 'go'], storyWords: [], pageCount: 24,
    sortOrder: 13, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l1-4', level: 1, subLevel: 'L1.4', title: 'The Red Socks',
    slug: 'the-red-socks', focusSounds: ['c', 'k', 'ck', 'e'],
    trickyWords: ['the', 'I', 'a', 'no', 'have', 'happy'], storyWords: [], pageCount: 24,
    sortOrder: 14, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l1-5', level: 1, subLevel: 'L1.5', title: 'Run, Pup, Run!',
    slug: 'run-pup-run', focusSounds: ['u', 'r', 'h', 'b'],
    trickyWords: ['the', 'I', 'a', 'is', 'have'], storyWords: [], pageCount: 24,
    sortOrder: 15, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l1-6', level: 1, subLevel: 'L1.6', title: 'Fox Fell Off!',
    slug: 'fox-fell-off', focusSounds: ['f', 'l', 'ff', 'll'],
    trickyWords: ['I', 'a', 'the', 'have', 'oh', 'happy'], storyWords: [], pageCount: 24,
    sortOrder: 16, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l1-7', level: 1, subLevel: 'L1.7', title: 'The Jam Jug',
    slug: 'the-jam-jug', focusSounds: ['j', 'v', 'w'],
    trickyWords: ['I', 'a', 'the', 'no', 'oh'], storyWords: [], pageCount: 24,
    sortOrder: 17, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l1-8', level: 1, subLevel: 'L1.8', title: 'The Yak and the Box',
    slug: 'the-yak-and-the-box', focusSounds: ['x', 'y', 'z'],
    trickyWords: ['I', 'a', 'the', 'have', 'no', 'oh'], storyWords: [], pageCount: 24,
    sortOrder: 18, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l1-9', level: 1, subLevel: 'L1.9', title: 'Chop, Chop, Chop!',
    slug: 'chop-chop-chop', focusSounds: ['ch', 'th'],
    trickyWords: ['I', 'a', 'the', 'is', 'have', 'happy'], storyWords: [], pageCount: 24,
    sortOrder: 19, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l1-10', level: 1, subLevel: 'L1.10', title: 'Buzz and Sing!',
    slug: 'buzz-and-sing', focusSounds: ['ss', 'zz', 'qu', 'ng'],
    trickyWords: ['I', 'a', 'the', 'no'], storyWords: [], pageCount: 24,
    sortOrder: 110, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  // ── Level 2 ──
  {
    id: 'prototype-l2-1', level: 2, subLevel: 'L2.1', title: 'The Night Light',
    slug: 'the-night-light', focusSounds: ['ay', 'ee', 'igh'],
    trickyWords: ['the', 'I', 'is', 'a'], storyWords: [], pageCount: 28,
    sortOrder: 21, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l2-2', level: 2, subLevel: 'L2.2', title: 'Moo at the Zoo',
    slug: 'moo-at-the-zoo', focusSounds: ['ow', 'oo'],
    trickyWords: ['the', 'I', 'to', 'no', 'my', 'me'], storyWords: [], pageCount: 28,
    sortOrder: 22, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l2-3', level: 2, subLevel: 'L2.3', title: 'Morning on the Farm',
    slug: 'morning-on-the-farm', focusSounds: ['ar', 'or'],
    trickyWords: ['the', 'I', 'we', 'go', 'a', 'her'], storyWords: [], pageCount: 28,
    sortOrder: 23, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l2-4', level: 2, subLevel: 'L2.4', title: 'The Fair in the Air',
    slug: 'the-fair-in-the-air', focusSounds: ['air', 'ir'],
    trickyWords: ['the', 'I', 'my', 'to', 'no', 'said'], storyWords: [], pageCount: 28,
    sortOrder: 24, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l2-5', level: 2, subLevel: 'L2.5', title: 'Round and Round',
    slug: 'round-and-round', focusSounds: ['ou', 'oy'],
    trickyWords: ['I', 'my', 'we', 'she', 'said', 'you', 'to'], storyWords: [], pageCount: 28,
    sortOrder: 25, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  // ── Level 3 ──
  {
    id: 'prototype-l3-1', level: 3, subLevel: 'L3.1', title: 'The Big Bike Race',
    slug: 'the-big-bike-race', focusSounds: ['a-e', 'i-e'],
    trickyWords: ['the', 'said', 'some', 'like', 'what', 'all'], storyWords: [], pageCount: 28,
    sortOrder: 31, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l3-2', level: 3, subLevel: 'L3.2', title: 'The Stone Flute',
    slug: 'the-stone-flute', focusSounds: ['o-e', 'u-e'],
    trickyWords: ['said', 'what', 'she', 'like', 'all', 'your'], storyWords: [], pageCount: 28,
    sortOrder: 32, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l3-3', level: 3, subLevel: 'L3.3', title: 'Reach for the Treat!',
    slug: 'reach-for-the-treat', focusSounds: ['ea', 'ie'],
    trickyWords: ['said', 'what', 'want', 'they', 'are', 'so'], storyWords: [], pageCount: 28,
    sortOrder: 33, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l3-4', level: 3, subLevel: 'L3.4', title: 'Draw It Again!',
    slug: 'draw-it-again', focusSounds: ['oi', 'aw'],
    trickyWords: ['said', 'she', 'he', 'are', 'so', 'they'], storyWords: [], pageCount: 28,
    sortOrder: 34, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l3-5', level: 3, subLevel: 'L3.5', title: 'The Boat with the Red Sail',
    slug: 'the-boat-with-the-red-sail', focusSounds: ['ai', 'oa'],
    trickyWords: ['said', 'was', 'so', 'he', 'what', 'they'], storyWords: [], pageCount: 28,
    sortOrder: 35, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  // ── Level 4 ──
  {
    id: 'prototype-l4-1', level: 4, subLevel: 'L4.1', title: 'The Purple Purse',
    slug: 'the-purple-purse', focusSounds: ['ur', 'er'],
    trickyWords: ['the', 'to', 'I', 'said', 'was', 'all', 'like', 'her', 'my', 'are', 'she', 'no', 'so', 'what'], storyWords: [], pageCount: 28,
    sortOrder: 41, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l4-2', level: 4, subLevel: 'L4.2', title: 'The Brown Owl',
    slug: 'the-brown-owl', focusSounds: ['are', 'ow'],
    trickyWords: ['said', 'was', 'what', 'were', 'she', 'all'], storyWords: [], pageCount: 28,
    sortOrder: 42, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l4-3', level: 4, subLevel: 'L4.3', title: 'The New Glue',
    slug: 'the-new-glue', focusSounds: ['ew', 'ue'],
    trickyWords: ['said', 'was', 'she', 'all', 'so', 'into'], storyWords: [], pageCount: 28,
    sortOrder: 43, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l4-4', level: 4, subLevel: 'L4.4', title: 'The Cheeky Monkey',
    slug: 'the-cheeky-monkey', focusSounds: ['are', 'ur', 'er', 'ew', 'ue', 'ow'],
    trickyWords: ['said', 'was', 'the', 'to', 'I', 'her', 'you', 'where'], storyWords: [], pageCount: 28,
    sortOrder: 44, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  // ── Level 5 ──
  {
    id: 'prototype-l5-1', level: 5, subLevel: 'L5.1', title: 'Before the Shore',
    slug: 'before-the-shore', focusSounds: ['ore', 'ire', 'oor'],
    trickyWords: ['said', 'was', 'once', 'would', 'something', 'they'], storyWords: [], pageCount: 28,
    sortOrder: 51, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l5-2', level: 5, subLevel: 'L5.2', title: 'Near the Door',
    slug: 'near-the-door', focusSounds: ['ear', 'oor'],
    trickyWords: ['said', 'was', 'could', 'through', 'over', 'are'], storyWords: [], pageCount: 28,
    sortOrder: 52, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l5-3', level: 5, subLevel: 'L5.3', title: 'Sure She Can',
    slug: 'sure-she-can', focusSounds: ['ure', 'tion'],
    trickyWords: ['said', 'was', 'they', 'people', 'through', 'over'], storyWords: [], pageCount: 28,
    sortOrder: 53, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l5-4', level: 5, subLevel: 'L5.4', title: 'A Place for Me',
    slug: 'a-place-for-me', focusSounds: ['ore', 'oor', 'ire', 'ear', 'ure', 'tion'],
    trickyWords: ['said', 'was', 'could', 'people', 'anyone', 'together'], storyWords: [], pageCount: 28,
    sortOrder: 54, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  // ── Level 6 ──
  {
    id: 'prototype-l6-1', level: 6, subLevel: 'L6.1', title: 'The Marvellous Neighbourhood',
    slug: 'the-marvellous-neighbourhood', focusSounds: ['ous'],
    trickyWords: ['said', 'was', 'could', 'would', 'through', 'their', 'people'], storyWords: [], pageCount: 28,
    sortOrder: 61, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l6-2', level: 6, subLevel: 'L6.2', title: 'You Are Remarkable',
    slug: 'you-are-remarkable', focusSounds: ['able', 'ible'],
    trickyWords: ['said', 'was', 'could', 'would', 'their', 'people', 'through'], storyWords: [], pageCount: 28,
    sortOrder: 62, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l6-3', level: 6, subLevel: 'L6.3', title: 'It Looks Suspicious!',
    slug: 'it-looks-suspicious', focusSounds: ['cious', 'tious'],
    trickyWords: ['said', 'was', 'could', 'would', 'their', 'people', 'through'], storyWords: [], pageCount: 28,
    sortOrder: 63, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
  {
    id: 'prototype-l6-4', level: 6, subLevel: 'L6.4', title: 'The Incredible Bush Walk',
    slug: 'the-incredible-bush-walk', focusSounds: ['ous', 'able', 'ible', 'cious', 'tious'],
    trickyWords: ['said', 'was', 'could', 'would', 'their', 'people', 'through', 'together'], storyWords: [], pageCount: 28,
    sortOrder: 64, unlocked: true, completed: false, lastPageRead: 0, pages: [],
  },
];

export default function Prototype() {
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const navigate = useNavigate();

  if (activeBook) {
    return (
      <InteractiveBookReader
        book={activeBook}
        onClose={() => setActiveBook(null)}
        onFinish={() => setActiveBook(null)}
      />
    );
  }

  // Book selector — group by level
  const availableBooks = DEMO_BOOKS.filter(b => b.subLevel in INTERACTIVE_BOOKS);
  const levels = [...new Set(availableBooks.map(b => b.level))].sort();

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center px-6 py-12 text-center"
      style={{ fontFamily: "'Andika', sans-serif" }}>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Interactive Books</h1>
      <p className="text-slate-500 mb-8">Choose a book to read</p>

      {levels.map(level => (
        <div key={level} className="w-full max-w-lg mb-8">
          <h2 className="text-xl font-bold text-slate-700 mb-3 text-left">
            Level {level}
            <span className="text-sm font-normal text-slate-400 ml-2">
              {level === 1 ? 'Starting Stories' : level === 2 ? 'Longer Sounds' : level === 3 ? 'Split Digraphs' : level === 4 ? 'Building Fluency' : level === 5 ? 'Confident Reader' : 'Advanced Suffixes'}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableBooks.filter(b => b.level === level).map(book => (
              <button key={book.id} onClick={() => setActiveBook(book)}
                className="flex items-center gap-3 p-3 bg-white rounded-2xl border-2 border-slate-200 hover:border-pink-300 hover:shadow-lg transition-all text-left">
                <img
                  src={`/illustrations/${book.subLevel.replace('L','').replace('.','_')}/cover.png`}
                  alt={book.title}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div>
                  <p className="text-xs text-pink-500 font-bold">{book.subLevel}</p>
                  <p className="text-base font-bold text-slate-800 leading-tight">{book.title}</p>
                  <p className="text-xs text-slate-500">Sounds: {book.focusSounds.join(', ')}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={() => navigate('/')}
        className="mt-8 px-6 py-3 rounded-xl font-bold text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
        Back to Library
      </button>
    </div>
  );
}
