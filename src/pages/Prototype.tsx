/**
 * Prototype page — self-contained interactive book demo for L1.1 "Tap! Tap! Tap!"
 * Access via /prototype — does NOT affect the main app.
 */
import { useState } from 'react';
import InteractiveBookReader from '@/components/InteractiveBookReader';
import { useNavigate } from 'react-router-dom';
import type { Book } from '@/lib/types';

// Hard-coded demo book so this page works without auth / Supabase
const DEMO_BOOK: Book = {
  id: 'prototype-l1-1',
  level: 1,
  subLevel: 'L1.1',
  title: 'Tap! Tap! Tap!',
  slug: 'tap-tap-tap',
  focusSounds: ['s', 'a', 't', 'p', 'i', 'n'],
  trickyWords: ['the', 'to', 'I'],
  storyWords: [],
  pageCount: 24,
  sortOrder: 11,
  unlocked: true,
  completed: false,
  lastPageRead: 0,
  pages: [],
};

export default function Prototype() {
  const [isReading, setIsReading] = useState(true);
  const navigate = useNavigate();

  if (isReading) {
    return (
      <InteractiveBookReader
        book={DEMO_BOOK}
        onClose={() => {
          setIsReading(false);
          navigate('/');
        }}
        onFinish={() => {
          setIsReading(false);
        }}
      />
    );
  }

  // Finished state
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-4">Interactive Book Prototype</h1>
      <p className="text-slate-500 mb-6 max-w-md">
        This was a demo of the interactive reading experience for "Tap! Tap! Tap!" (Level 1.1).
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setIsReading(true)}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-pink-500 text-white hover:bg-pink-600 transition-colors"
        >
          Read Again
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
        >
          Back to Library
        </button>
      </div>
    </div>
  );
}
