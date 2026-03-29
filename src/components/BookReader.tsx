import { useState, useCallback, useRef, useEffect } from 'react';
import { Book } from '@/lib/types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface BookReaderProps {
  book: Book;
  onClose: () => void;
  onFinish: () => void;
}

const levelColors: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

const SWIPE_THRESHOLD = 50;

/** All books are now 24 pages */
function getPageCount(_level: number): number {
  return 24;
}

/** Convert subLevel "L2.3" to the book-pages folder key "2_3" */
function subLevelToKey(subLevel: string): string | null {
  const m = subLevel.match(/^L(\d+)\.(\d+)$/);
  return m ? `${m[1]}_${m[2]}` : null;
}

export default function BookReader({ book, onClose, onFinish }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const key = subLevelToKey(book.subLevel);
  const totalPages = getPageCount(book.level);
  const levelBg = levelColors[book.level] || 'bg-primary';

  const getPageUrl = (index: number) =>
    key ? `/book-pages/${key}/p${index + 1}.jpg` : null;

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
    } else {
      onFinish();
    }
  }, [currentPage, totalPages, onFinish]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Preload adjacent pages
  useEffect(() => {
    for (let offset = 1; offset <= 2; offset++) {
      const idx = currentPage + offset;
      if (idx < totalPages) {
        const url = getPageUrl(idx);
        if (url) {
          const img = new Image();
          img.src = url;
        }
      }
    }
  }, [currentPage, totalPages, key]);

  const pageUrl = getPageUrl(currentPage);
  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col"
      style={{ isolation: 'isolate' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/90 backdrop-blur-sm z-10 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="Close book"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white font-semibold text-sm truncate max-w-[200px]">
          {book.title}
        </h2>
        <span className="text-white/60 text-xs font-medium min-w-[50px] text-right">
          {currentPage + 1} / {totalPages}
        </span>
      </div>

      {/* Page display */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {pageUrl ? (
          <img
            key={currentPage}
            src={pageUrl}
            alt={`${book.title} — page ${currentPage + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        ) : (
          <div className="text-white/50 text-center">
            <p className="text-lg font-bold">{book.title}</p>
            <p className="text-sm mt-2">Page images not available</p>
          </div>
        )}

        {/* Desktop arrows */}
        {!isFirst && (
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors z-10 hidden md:flex"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors z-10 hidden md:flex"
            aria-label="Next page"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Mobile tap zones */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/4 z-[1] md:hidden"
          onClick={goPrev}
          aria-hidden="true"
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/4 z-[1] md:hidden"
          onClick={goNext}
          aria-hidden="true"
        />
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-1 py-2.5 bg-slate-800/90 backdrop-blur-sm shrink-0">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-colors mr-2"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex gap-1 max-w-[220px] overflow-hidden items-center">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`rounded-full transition-all duration-200 ${
                i === currentPage
                  ? `w-5 h-2 ${levelBg}`
                  : 'w-2 h-2 bg-white/25 hover:bg-white/40'
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className={`p-2 rounded-lg transition-colors ml-2 ${
            isLast ? `${levelBg} text-white` : 'hover:bg-white/10 text-white'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
