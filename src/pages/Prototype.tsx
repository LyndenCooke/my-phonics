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

  // Book selector
  const availableBooks = DEMO_BOOKS.filter(b => b.subLevel in INTERACTIVE_BOOKS);

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6 text-center"
      style={{ fontFamily: "'Andika', sans-serif" }}>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Interactive Books</h1>
      <p className="text-slate-500 mb-8">Choose a book to read</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
        {availableBooks.map(book => (
          <button key={book.id} onClick={() => setActiveBook(book)}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-pink-300 hover:shadow-lg transition-all text-left">
            <img
              src={`/illustrations/${book.subLevel.replace('L','').replace('.','_')}/cover.png`}
              alt={book.title}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
            <div>
              <p className="text-xs text-pink-500 font-bold">{book.subLevel}</p>
              <p className="text-lg font-bold text-slate-800">{book.title}</p>
              <p className="text-sm text-slate-500">Sounds: {book.focusSounds.join(', ')}</p>
            </div>
          </button>
        ))}
      </div>

      <button onClick={() => navigate('/')}
        className="mt-8 px-6 py-3 rounded-xl font-bold text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
        Back to Library
      </button>
    </div>
  );
}
