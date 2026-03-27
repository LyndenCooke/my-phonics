import { useState } from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Book, LEVELS } from '@/lib/types';
import { getCoverImageUrl } from '@/lib/imageResolver';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

const levelBgClasses: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function BookCard({ book, onSelect }: BookCardProps) {
  const levelInfo = LEVELS.find((l) => l.level === book.level);
  const levelBg = levelBgClasses[book.level] || 'bg-primary';
  const [imgError, setImgError] = useState(false);

  // Resolve cover image: use Supabase URL, fall back to local PNG
  const resolvedCover = getCoverImageUrl(book.subLevel, book.coverImageUrl);
  const showImage = resolvedCover && !imgError;

  return (
    <button
      onClick={() => onSelect(book)}
      className={`group relative rounded-xl overflow-hidden text-left w-full transition-all duration-200 ${
        book.unlocked
          ? 'hover:shadow-card-hover hover:-translate-y-1 active:scale-[0.98] cursor-pointer shadow-card'
          : 'cursor-pointer shadow-card hover:shadow-card-hover'
      }`}
    >
      {/* Cover area */}
      <div className={`${levelBg} aspect-[3/4] flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/10" />

        {/* Sub-level badge */}
        <span className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-foreground shadow-sm">
          {book.subLevel}
        </span>

        {/* Completion check */}
        {book.completed && (
          <div className="absolute top-2 right-2 z-10">
            <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
          </div>
        )}

        {/* Cover image or title */}
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

        {/* Lock overlay — frosted glass */}
        {!book.unlocked && (
          <div className="absolute inset-0 z-10 bg-foreground/20 backdrop-blur-[2px] flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="bg-card p-2.5">
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
    </button>
  );
}
