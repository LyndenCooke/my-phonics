import type React from 'react';
import type { ActivityType, BookData } from '@/data/schema';

import tapTapTap from '@/data/books/tap-tap-tap';

import TraceSounds from '@/components/templates/TraceSounds';
import MatchPictureWord from '@/components/templates/MatchPictureWord';
import SortBySound from '@/components/templates/SortBySound';
import SoundSpotting from '@/components/templates/SoundSpotting';
import MissingSound from '@/components/templates/MissingSound';
import SentenceBuilder from '@/components/templates/SentenceBuilder';
import DrawAndWrite from '@/components/templates/DrawAndWrite';
import ReadAndTick from '@/components/templates/ReadAndTick';
import CutAndStick from '@/components/templates/CutAndStick';
import Challenge from '@/components/templates/Challenge';

// ---------------------------------------------------------------------------
// REGISTRY — maps book ids -> data, and activity types -> template component.
// Add a book: import its data file and add it to BOOKS.
// Add a template: build the component and add it to TEMPLATES.
// ---------------------------------------------------------------------------

export const BOOKS: Record<string, BookData> = {
  [tapTapTap.bookId]: tapTapTap,
};

type TemplateComponent = React.ComponentType<{ book: BookData }>;

export const TEMPLATES: Partial<Record<ActivityType, TemplateComponent>> = {
  'trace-sounds': TraceSounds,
  'match-picture-word': MatchPictureWord,
  'sort-by-sound': SortBySound,
  'sound-spotting': SoundSpotting,
  'missing-sound': MissingSound,
  'sentence-builder': SentenceBuilder,
  'draw-and-write': DrawAndWrite,
  'read-and-tick': ReadAndTick,
  'cut-and-stick': CutAndStick,
  'challenge': Challenge,
};

export function getBook(bookId: string): BookData | undefined {
  return BOOKS[bookId];
}

export function getTemplate(activity: ActivityType): TemplateComponent | undefined {
  return TEMPLATES[activity];
}

/** Every (book, sheet) pair the engine can currently render. */
export function allSheets(): { book: string; sheet: ActivityType }[] {
  return Object.values(BOOKS).flatMap((b) =>
    b.activityTypes
      .filter((a) => TEMPLATES[a])
      .map((a) => ({ book: b.bookId, sheet: a })),
  );
}
