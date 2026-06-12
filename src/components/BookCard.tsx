/**
 * BookCard — the book as a physical object.
 *
 * Design language: "paper & stickers". Every book renders with page edges,
 * a spine shadow and a soft ground shadow, like a real book standing on a
 * shelf. Hover lifts and straightens it. No internal codes ever leak.
 *
 * Locked books are unmistakable (per user feedback): dimmed cover +
 * centred frosted lock — clarity beats subtlety for a 4-year-old.
 */
import { useState } from 'react';
import { Lock, Check, Download } from 'lucide-react';
import { Book } from '@/lib/types';
import { getJourneyLevel, journeyLevelOf } from '@/lib/levels8';
import { getCoverImageUrl } from '@/lib/imageResolver';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  /**
   * Optional download handler. When provided, an unlocked book renders a
   * download icon under the title. The handler is responsible for calling
   * the gated download endpoint and surfacing tier/throttle errors — this
   * component only emits the intent.
   */
  onDownload?: (book: Book) => void;
}

export default function BookCard({ book, onSelect, onDownload }: BookCardProps) {
  const journey = getJourneyLevel(journeyLevelOf(book.subLevel));
  const hex = journey?.hex ?? '#E84B8A';
  const [imgError, setImgError] = useState(false);

  const resolvedCover = getCoverImageUrl(book.subLevel, book.coverImageUrl);
  const showImage = resolvedCover && !imgError;

  // Card outer is a div + role=button so the nested download icon can be a
  // real <button> without violating HTML (no button-in-button). Keyboard a11y
  // is preserved via Enter/Space handling on the outer element.
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(book);
    }
  };

  return (
    <div
      id={`book-card-${book.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(book)}
      onKeyDown={handleKey}
      aria-label={`${book.title}${book.completed ? ' — done' : book.unlocked ? '' : ' — locked'}`}
      className="group text-left w-full cursor-pointer"
    >
      {/* The book object */}
      <div className="relative px-1 pt-1 transition-transform duration-200 group-hover:-translate-y-1.5 group-hover:rotate-[-1deg] group-active:scale-[0.97]">
        {/* page edges */}
        <span aria-hidden className="absolute top-[5px] right-[0px] bottom-[7px] w-[7px] rounded-r-sm bg-[#f3ead9] ring-1 ring-black/10" />
        <span aria-hidden className="absolute top-[8px] -right-[3px] bottom-[9px] w-[7px] rounded-r-sm bg-[#e9dfc8] ring-1 ring-black/10" />

        <div
          className="relative aspect-[3/4] rounded-md rounded-r-sm overflow-hidden ring-1 ring-black/15"
          style={!showImage ? { background: hex } : undefined}
        >
          {showImage ? (
            <img
              src={resolvedCover}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
              <p className="font-child text-base font-bold leading-snug text-white drop-shadow-md">
                {book.title}
              </p>
            </div>
          )}

          {/* spine shading */}
          <span aria-hidden className="absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/20 to-transparent" />

          {book.completed && (
            <span
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md"
              style={{ background: hex }}
            >
              <Check className="w-3.5 h-3.5" strokeWidth={3.5} />
            </span>
          )}

          {/* Locked — unmistakable: dim + centred frosted lock.
              backdrop-filter layers escape the parent's rounded
              overflow-hidden clip in Chromium, so the overlay carries the
              cover's own radii explicitly. */}
          {!book.unlocked && (
            <span className="absolute inset-0 rounded-md rounded-r-sm bg-slate-900/35 backdrop-blur-[1.5px] flex items-center justify-center overflow-hidden">
              <span className="w-10 h-10 rounded-full bg-white/25 ring-1 ring-white/50 backdrop-blur-sm flex items-center justify-center">
                <Lock className="w-[18px] h-[18px] text-white" />
              </span>
            </span>
          )}
        </div>

        {/* ground shadow */}
        <span aria-hidden className="absolute -bottom-1.5 left-[12%] right-[10%] h-2.5 rounded-[100%] bg-black/15 blur-[5px] transition-all duration-200 group-hover:-bottom-2.5 group-hover:bg-black/10" />
      </div>

      {/* Title row */}
      <div className="mt-3 px-1 flex items-start gap-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-display font-bold text-foreground leading-snug truncate">
            {book.title}
          </p>
          {book.unlocked && book.lastPageRead > 0 && !book.completed && (
            <div className="mt-1.5 h-1 rounded-full bg-black/[0.07] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((book.lastPageRead / book.pageCount) * 100)}%`,
                  background: hex,
                }}
              />
            </div>
          )}
        </div>

        {book.unlocked && onDownload && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(book);
            }}
            aria-label={`Download ${book.title} PDF`}
            title="Download PDF"
            className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-black/5 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
