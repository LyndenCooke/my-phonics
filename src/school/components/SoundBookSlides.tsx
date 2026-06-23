import type { SoundBook } from '../data/soundBooks';
import { SOUND_BOOK_CONTENT } from './soundbook/engine';
import SoundBookExperience from './soundbook/SoundBookExperience';

/**
 * SoundBookSlides — launches the bespoke, animated interactive Sound Book
 * experience (NOT the storybook reader) for a given Sound Book. Content is keyed
 * by the SoundBook id. Cards only show "Play slides" when content exists
 * (SOUND_BOOK_CONTENT_IDS), so a missing entry shouldn't happen, but we guard.
 */
export default function SoundBookSlides({ book, onClose }: { book: SoundBook; onClose: () => void }) {
  const content = SOUND_BOOK_CONTENT[book.id];
  if (!content) { onClose(); return null; }
  return <SoundBookExperience content={content} onClose={onClose} />;
}
