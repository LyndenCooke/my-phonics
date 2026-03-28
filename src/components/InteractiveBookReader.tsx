import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Volume2, Sparkles, Star, Trash2, Palette } from 'lucide-react';
import { Book } from '@/lib/types';
import { INTERACTIVE_BOOKS, type InteractivePage, type StoryWord, type SpotlightItem } from '@/lib/interactiveBookData';
import TappableWord from '@/components/interactive/TappableWord';

// ─── Audio helpers ──────────────────────────────────────────────────────────

function playAudioFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`Not found: ${url}`));
    audio.oncanplaythrough = () => { audio.play().catch(reject); };
    audio.load();
  });
}

function speakWord(word: string): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-GB';
    u.rate = 0.85;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

async function playWord(word: string): Promise<void> {
  const key = word.toLowerCase().replace(/\s+/g, '_');
  try { await playAudioFile(`/sounds/words/${key}.mp3`); }
  catch { await speakWord(word); }
}

async function playPhoneme(g: string): Promise<void> {
  try { await playAudioFile(`/sounds/${g.toLowerCase().replace(/-/g, '_')}.mp3`); }
  catch { /* no fallback for phonemes */ }
}

// ─── Page renderers ─────────────────────────────────────────────────────────

function CoverPage({ page }: { page: Extract<InteractivePage, { type: 'cover' }> }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <img
        src={page.imageUrl}
        alt={page.title}
        className="w-full max-w-xs rounded-2xl shadow-xl mb-6 object-cover"
        draggable={false}
      />
      <h1 className="text-3xl font-extrabold text-slate-800">{page.title}</h1>
      <p className="text-lg text-slate-500 mt-2">{page.subtitle}</p>
      <p className="text-sm text-pink-500 mt-4 animate-bounce">Swipe to start reading →</p>
    </div>
  );
}

function ImagePage({ page }: { page: Extract<InteractivePage, { type: 'image_page' }> }) {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <img
        src={page.imageUrl}
        alt="Book page"
        className="max-w-full max-h-full object-contain rounded-lg"
        draggable={false}
      />
    </div>
  );
}

function SoundGridPage({ page }: { page: Extract<InteractivePage, { type: 'sound_grid' }> }) {
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const handleSoundTap = async (sound: string) => {
    setPlayingSound(sound);
    await playPhoneme(sound);
    setPlayingSound(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
      {/* Sound grid — left side on desktop */}
      <div className="flex-1 px-4 py-3 md:overflow-y-auto">
      <h2 className="text-xl font-extrabold text-slate-800 mb-1">Sounds in This Book</h2>
      <p className="text-sm text-slate-500 mb-3">Tap each sound to hear it!</p>

      <div className="grid grid-cols-6 md:grid-cols-9 gap-1.5 mb-4">
        {page.allSounds.map((s) => {
          const isFocus = page.focusSounds.includes(s);
          const isPlaying = playingSound === s;
          return (
            <button
              key={s}
              onClick={() => handleSoundTap(s)}
              className={`
                py-2 rounded-xl text-sm font-bold transition-all duration-200
                ${isPlaying
                  ? 'bg-pink-500 text-white scale-110 shadow-lg'
                  : isFocus
                    ? 'bg-pink-100 text-pink-700 border-2 border-pink-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }
              `}
            >
              {s}
            </button>
          );
        })}
      </div>

      </div>

      {/* Story words — right side on desktop */}
      <div className="md:w-[40%] md:border-l md:border-slate-200 px-4 py-3 md:overflow-y-auto">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Story Words</h3>
      <p className="text-sm text-slate-500 mb-2">Tap a word, then tap the sounds below it!</p>
      <div className="flex flex-wrap gap-1">
        {page.storyWords.map((w, i) => (
          <TappableWord key={i} wordData={w} focusSounds={page.focusSounds} />
        ))}
      </div>
      </div>
    </div>
  );
}

function StoryPage({ page, focusSounds }: {
  page: Extract<InteractivePage, { type: 'story' }>;
  focusSounds: string[];
}) {
  const [isNarrating, setIsNarrating] = useState(false);

  const handleNarrate = async () => {
    if (isNarrating) return;
    setIsNarrating(true);
    for (const w of page.words) {
      await playWord(w.word);
      await new Promise(r => setTimeout(r, 250));
    }
    setIsNarrating(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* MOBILE: stacked (text top, image bottom) / DESKTOP: side-by-side (image left, text right) */}

      {/* Illustration — left side on desktop, bottom on mobile */}
      <div className="order-2 md:order-1 flex-1 md:flex-1 relative overflow-hidden">
        <img
          src={page.imageUrl}
          alt="Story illustration"
          className="absolute inset-0 w-full h-full object-cover object-bottom md:object-center"
          draggable={false}
        />
        {/* Mobile: top gradient to blend with text */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/80 to-transparent md:hidden" />
        {/* Desktop: right gradient to blend with text panel */}
        <div className="hidden md:block absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent" />
      </div>

      {/* Text + controls — right side on desktop, top on mobile */}
      <div className="order-1 md:order-2 flex flex-col md:w-[45%] md:max-w-lg bg-white/90 backdrop-blur-sm flex-shrink-0 md:flex-shrink-0">
        <div className="px-4 pt-3 pb-2 flex-1 overflow-y-auto">
          <div className="flex flex-wrap items-end">
            {page.words.map((w, i) => (
              <TappableWord key={i} wordData={w} focusSounds={focusSounds} />
            ))}
          </div>
        </div>

        {/* Read to me button */}
        <div className="px-4 py-2 flex-shrink-0">
          <button
            onClick={handleNarrate}
            disabled={isNarrating}
            className={`
              w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2
              transition-all duration-200
              ${isNarrating
                ? 'bg-pink-500 text-white animate-pulse'
                : 'bg-pink-100 text-pink-700 hover:bg-pink-200 active:scale-[0.98]'
              }
            `}
          >
            <Volume2 className="w-5 h-5" />
            {isNarrating ? 'Reading...' : 'Read to me'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SoundSpotlightPage({ page }: { page: Extract<InteractivePage, { type: 'sound_spotlight' }> }) {
  const [playingItem, setPlayingItem] = useState<string | null>(null);
  const [playingSound, setPlayingSound] = useState(false);

  const handleItemTap = async (item: SpotlightItem) => {
    setPlayingItem(item.word);
    await playWord(item.word);
    setPlayingItem(null);
  };

  const handleSoundTap = async () => {
    setPlayingSound(true);
    await playPhoneme(page.sound);
    setPlayingSound(false);
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start md:justify-center h-full px-4 py-4 overflow-y-auto md:overflow-hidden gap-6">
      {/* Left: big letter button */}
      <div className="flex flex-col items-center md:justify-center md:h-full flex-shrink-0">
        <p className="text-sm font-bold text-pink-500 mb-2">Sound Spotlight</p>
        <button
          onClick={handleSoundTap}
          className={`
            w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center
            text-4xl md:text-5xl font-extrabold transition-all duration-200
            ${playingSound
              ? 'bg-pink-500 text-white scale-110 ring-4 ring-pink-300 animate-pulse'
              : 'bg-pink-100 text-pink-600 hover:bg-pink-200 shadow-lg'
            }
          `}
          aria-label={`Play sound ${page.sound}`}
        >
          {page.sound}
        </button>
        <p className="text-xs text-slate-400 mt-2">Tap to hear!</p>
      </div>

      {/* Right: Word cards in 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm md:max-w-md">
        {page.items.map((item) => {
          const isActive = playingItem === item.word;
          const letters = item.word.split('');
          return (
            <button
              key={item.word}
              onClick={() => handleItemTap(item)}
              className={`
                flex flex-col items-center p-4 rounded-2xl border-2
                transition-all duration-200
                ${isActive
                  ? 'border-pink-400 bg-pink-50 scale-105 shadow-lg'
                  : 'border-slate-200 bg-white hover:border-pink-200 shadow-sm'
                }
              `}
            >
              <span className="text-5xl mb-2">{item.emoji}</span>
              <span className="text-xl font-bold">
                {letters.map((letter, li) => (
                  <span
                    key={li}
                    className={li === item.focusIndex ? 'text-pink-600' : 'text-slate-700'}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-4">Tap a card to hear the word!</p>
    </div>
  );
}

function WordReadingPage({ page, title, subtitle, focusSounds }: {
  page: Extract<InteractivePage, { type: 'word_reading' }>;
  title: string;
  subtitle: string;
  focusSounds: string[];
}) {
  return (
    <div className="flex flex-col items-center h-full px-4 py-4 overflow-y-auto">
      <h2 className="text-xl font-extrabold text-slate-800 mb-1">{title}</h2>
      <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {page.words.map((w, i) => (
          <div key={i} className="flex justify-center">
            <TappableWord wordData={w} focusSounds={focusSounds} size="large" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TrickyWordsPage({ page }: { page: Extract<InteractivePage, { type: 'tricky_words' }> }) {
  return (
    <div className="flex flex-col items-center h-full px-4 py-4 overflow-y-auto">
      <h2 className="text-xl font-extrabold text-slate-800 mb-1">Tricky Words</h2>
      <p className="text-sm text-slate-500 mb-2">These cannot be sounded out. Learn them by heart!</p>
      <div className="flex items-center gap-1 mb-6">
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        <span className="text-xs text-amber-600 font-semibold">Tap each word to hear it</span>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {page.words.map((w, i) => (
          <TrickyWordCard key={i} wordData={w} />
        ))}
      </div>
    </div>
  );
}

function TrickyWordCard({ wordData }: { wordData: StoryWord }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTap = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    await playWord(wordData.word);
    setIsPlaying(false);
  };

  return (
    <button
      onClick={handleTap}
      className={`
        py-4 rounded-2xl text-2xl font-bold italic
        border-2 transition-all duration-200
        ${isPlaying
          ? 'border-purple-400 bg-purple-100 text-purple-700 scale-105'
          : 'border-slate-200 bg-white text-slate-700 hover:border-purple-200'
        }
      `}
    >
      {wordData.display}
    </button>
  );
}

function NonsenseWordsPage({ page, focusSounds }: {
  page: Extract<InteractivePage, { type: 'nonsense_words' }>;
  focusSounds: string[];
}) {
  return (
    <div className="flex flex-col items-center h-full px-4 py-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-green-500" />
        <h2 className="text-xl font-extrabold text-slate-800">Alien Words</h2>
        <Sparkles className="w-5 h-5 text-green-500" />
      </div>
      <p className="text-sm text-slate-500 mb-4 text-center">
        These aren't real words! Use your phonics to sound them out.
      </p>
      <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
        {page.words.map((w, i) => (
          <div key={i} className="flex justify-center">
            <TappableWord wordData={w} focusSounds={focusSounds} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Drawing / Writing Canvas ───────────────────────────────────────────────

function DrawingCanvas({ prompt }: { prompt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [color, setColor] = useState('#e91e63');
  const colors = ['#e91e63', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#333333'];

  const getCtx = () => canvasRef.current?.getContext('2d');

  const getPos = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = getCtx();
    const pos = getPos(e);
    if (ctx && pos) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = getCtx();
    const pos = getPos(e);
    if (ctx && pos) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const endDraw = () => { isDrawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Size canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    }
  }, []);

  return (
    <div className="flex flex-col h-full px-4 py-3">
      <h2 className="text-xl font-extrabold text-slate-800 mb-2">{prompt}</h2>

      <div className="flex items-center gap-2 mb-2">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-3 ring-offset-2 ring-slate-400 scale-110' : ''}`}
            style={{ backgroundColor: c }}
            aria-label={`Select color ${c}`}
          />
        ))}
        <button
          onClick={clearCanvas}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200"
        >
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="flex-1 rounded-2xl border-2 border-dashed border-slate-300 bg-white touch-none cursor-crosshair"
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
      />
    </div>
  );
}

function WritingPracticePage({ page }: { page: Extract<InteractivePage, { type: 'writing_practice' }> }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="flex flex-col h-full px-4 py-3">
      <h2 className="text-xl font-extrabold text-slate-800 mb-1">Writing Practice</h2>
      <p className="text-sm text-slate-500 mb-3">Tap a letter, then trace it below!</p>

      {/* Letter selector */}
      <div className="flex gap-2 mb-3">
        {page.letters.map((letter, i) => (
          <button
            key={i}
            onClick={async () => {
              setActiveIdx(i);
              await playPhoneme(letter);
            }}
            className={`
              flex-1 py-3 rounded-xl text-2xl font-extrabold transition-all duration-200
              ${i === activeIdx
                ? 'bg-pink-500 text-white shadow-lg scale-105'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Tracing area with ghost letter */}
      <div className="flex-1 relative rounded-2xl border-2 border-dashed border-slate-300 bg-white overflow-hidden">
        {/* Ghost letter */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[12rem] font-extrabold text-slate-100 select-none">
            {page.letters[activeIdx]}
          </span>
        </div>
        {/* Canvas overlay */}
        <WritingCanvas />
      </div>
    </div>
  );
}

function WritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const getCtx = () => canvasRef.current?.getContext('2d');

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const start = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = getCtx();
    const pos = getPos(e);
    if (ctx && pos) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = '#e91e63';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const move = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = getCtx();
    const pos = getPos(e);
    if (ctx && pos) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
  };

  const end = () => { isDrawing.current = false; };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) { canvas.width = canvas.offsetWidth * 2; canvas.height = canvas.offsetHeight * 2; }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
      onTouchStart={start}
      onTouchMove={move}
      onTouchEnd={end}
      onMouseDown={start}
      onMouseMove={move}
      onMouseUp={end}
      onMouseLeave={end}
    />
  );
}

function CertificatePage({ page }: { page: Extract<InteractivePage, { type: 'certificate' }> }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center relative overflow-hidden">
      {/* Simple confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-sm animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#e91e63', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#ffeb3b'][i % 6],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-white rounded-3xl border-4 border-pink-400 p-8 shadow-2xl max-w-xs w-full">
        <div className="text-5xl mb-3">⭐</div>
        <h1 className="text-2xl font-extrabold text-pink-600 mb-2">I Read a Book!</h1>
        <p className="text-sm text-slate-500 mb-3">Reading Star Certificate</p>
        <p className="text-xl font-bold italic text-slate-700 mb-4">{page.bookTitle}</p>
        <div className="border-t-2 border-dashed border-slate-200 pt-3 mt-3">
          <p className="text-xs text-slate-400">MyPhonicsBooks · Level 1</p>
        </div>
      </div>

      <p className="text-pink-600 font-bold mt-6 text-lg">Well done! You're a reading star!</p>
    </div>
  );
}

// ─── Main Interactive Book Reader ───────────────────────────────────────────

interface InteractiveBookReaderProps {
  book: Book;
  onClose: () => void;
  onFinish: () => void;
}

const levelColors: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

const SWIPE_THRESHOLD = 50;

export default function InteractiveBookReader({ book, onClose, onFinish }: InteractiveBookReaderProps) {
  const pages = INTERACTIVE_BOOKS[book.subLevel] ?? [];
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const totalPages = pages.length;
  const levelBg = levelColors[book.level] || 'bg-primary';

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
    else onFinish();
  }, [currentPage, totalPages, onFinish]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  }, [currentPage]);

  // Keyboard nav
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [goNext, goPrev, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Swipe handling — only on non-canvas pages
  const pageData = pages[currentPage];
  const isCanvasPage = pageData?.type === 'drawing' || pageData?.type === 'writing_practice';

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isCanvasPage) return; // Don't intercept drawing gestures
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isCanvasPage || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) goNext(); else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1;

  // ─── Render page content ────────────────────────────────────────────────
  const renderPage = () => {
    const p = pages[currentPage];
    if (!p) return null;

    const focusSounds = book.focusSounds;

    switch (p.type) {
      case 'cover':
        return <CoverPage page={p} />;
      case 'image_page':
        return <ImagePage page={p} />;
      case 'sound_grid':
        return <SoundGridPage page={p} />;
      case 'story':
        return <StoryPage page={p} focusSounds={focusSounds} />;
      case 'sound_spotlight':
        return <SoundSpotlightPage page={p} />;
      case 'word_reading':
        return <WordReadingPage page={p} title="Can You Read These Words?" subtitle="Tap each word to hear it!" focusSounds={focusSounds} />;
      case 'tricky_words':
        return <TrickyWordsPage page={p} />;
      case 'writing_practice':
        return <WritingPracticePage page={p} />;
      case 'drawing':
        return <DrawingCanvas prompt={p.prompt} />;
      case 'nonsense_words':
        return <NonsenseWordsPage page={p} focusSounds={focusSounds} />;
      case 'certificate':
        return <CertificatePage page={p} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-amber-50 flex flex-col"
      style={{ isolation: 'isolate' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2 ${levelBg} z-10 shrink-0`}>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Close book"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white font-semibold text-sm truncate max-w-[200px]">
          {book.title}
        </h2>
        <span className="text-white/80 text-xs font-medium min-w-[50px] text-right">
          {currentPage + 1} / {totalPages}
        </span>
      </div>

      {/* Page content */}
      <div className="flex-1 relative overflow-hidden">
        {renderPage()}

        {/* Desktop nav arrows */}
        {!isFirst && (
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/70 shadow-lg flex items-center justify-center hover:bg-white transition-colors z-20 hidden md:flex"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/70 shadow-lg flex items-center justify-center hover:bg-white transition-colors z-20 hidden md:flex"
            aria-label="Next page"
          >
            <ChevronRight className="w-6 h-6 text-slate-700" />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-1 py-2.5 bg-white/90 backdrop-blur-sm shrink-0">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors mr-2"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>

        <div className="flex gap-1 max-w-[220px] overflow-hidden items-center">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`rounded-full transition-all duration-200 ${
                i === currentPage
                  ? `w-5 h-2 ${levelBg}`
                  : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className={`p-2 rounded-lg transition-colors ml-2 ${
            isLast ? `${levelBg} text-white rounded-xl px-4` : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          {isLast ? (
            <span className="text-sm font-bold">Finish</span>
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
