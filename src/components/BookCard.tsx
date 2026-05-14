import { useState } from 'react';
import { Lock, CheckCircle2, Sparkles, Download } from 'lucide-react';
import { Book, LEVELS } from '@/lib/types';
import { getCoverImageUrl } from '@/lib/imageResolver';
import { hasInteractiveData } from '@/lib/interactiveBooksAvailability';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  /**
   * Optional download handler. When provided, an unlocked book renders a
   * download icon to the right of the title. The handler is responsible for
   * calling the gated download endpoint and surfacing tier/throttle errors
   * — this component only emits the intent.
   */
  onDownload?: (book: Book) => void;
}

const levelBgClasses: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function BookCard({ book, onSelect, onDownload }: BookCardProps) {
  const levelInfo = LEVELS.find((l) => l.level === book.level);
  const levelBg = levelBgClasses[book.level] || 'bg-primary';
  const [imgError, setImgError] = useState(false);
  const isInteractive = hasInteractiveData(book.subLevel);

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
      className={`group relative rounded-xl overflow-hidden text-left w-full transition-all duration-200 ${
        book.unlocked
          ? 'hover:shadow-card-hover hover:-translate-y-1 active:scale-[0.98] cursor-pointer shadow-card'
          : 'cursor-pointer shadow-card hover:shadow-card-hover'
      }`}
    >
      {/* Cover area */}
      <div className={`${levelBg} aspect-[3/4] flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/10" />

        <span className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-foreground shadow-sm">
          {book.subLevel}
        </span>

        {book.completed && (
          <div className="absolute top-2 right-2 z-10">
            <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
          </div>
        )}

        {isInteractive && !book.completed && (
          <div
            className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-foreground shadow-sm"
            title="Tap-to-hear interactive reader"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>Interactive</span>
          </div>
        )}

        {showImage ? (
          <img
            src={resolvedCover}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover z-[1]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="relative z-[5] text-center px-2">
            <p className="font-child text-base font-bold leading-tight text-white drop-shadow-md">
              {book.title}
            </p>
          </div>
        )}

        {!book.unlocked && (
          <div className="absolute inset-0 z-10 bg-foreground/20 backdrop-blur-[2px] flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Info footer — title on left, download icon on right (unlocked only) */}
      <div className="bg-card p-2.5 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{book.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {levelInfo?.name}
          </p>
          {book.unlocked && book.lastPageRead > 0 && !book.completed && (
            <div className="mt-1.5">
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${levelBg} transition-all duration-300`}
                  style={{ width: `${Math.round((book.lastPageRead / book.pageCount) * 100)}%` }}
                />
              </div>
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
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary hover:bg-tint-pink active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
