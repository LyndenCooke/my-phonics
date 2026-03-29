import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Volume2, Sparkles, Star, Trash2, Check, RotateCcw } from 'lucide-react';
import { Book } from '@/lib/types';
import {
  INTERACTIVE_BOOKS,
  type InteractivePage, type StoryWord, type SpotlightItem,
  type OrderingItem, type QuizQuestion, type SpellingWord,
} from '@/lib/interactiveBookData';
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

async function playPhoneme(g: string): Promise<void> {
  try { await playAudioFile(`/sounds/${g.toLowerCase().replace(/-/g, '_')}.mp3`); }
  catch { /* no fallback */ }
}

async function playWordAsPhonemes(word: string): Promise<void> {
  const graphemes = splitDigraphs(word);
  for (const g of graphemes) {
    await playPhoneme(g);
    await new Promise(r => setTimeout(r, 150));
  }
}

const ANDIKA: React.CSSProperties = { fontFamily: "'Andika', sans-serif" };

/** Split a word into graphemes, keeping digraphs (sh, ch, th, ng, nk, ck, ff, ll, ss, zz, qu) intact */
function splitDigraphs(word: string): string[] {
  const digraphs = ['sh','ch','th','ng','nk','ck','ff','ll','ss','zz','qu'];
  const result: string[] = [];
  let i = 0;
  while (i < word.length) {
    const pair = word.slice(i, i + 2);
    if (digraphs.includes(pair)) { result.push(pair); i += 2; }
    else { result.push(word[i]); i += 1; }
  }
  return result;
}

// ─── Cover ──────────────────────────────────────────────────────────────────

function CoverPage({ page }: { page: Extract<InteractivePage, { type: 'cover' }> }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-xl mb-6 flex-shrink-0">
        <img src={page.imageUrl} alt={page.title} className="w-full h-full object-cover" draggable={false} />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-slate-800">{page.title}</h1>
      <p className="text-xl text-slate-500 mt-2">{page.subtitle}</p>
      <p className="text-base text-pink-500 mt-6 animate-bounce">Swipe to start &rarr;</p>
    </div>
  );
}

// ─── Sound Grid ─────────────────────────────────────────────────────────────

function SoundGridPage({ page, level }: { page: Extract<InteractivePage, { type: 'sound_grid' }>; level: number }) {
  const [playingGroup, setPlayingGroup] = useState<string | null>(null);

  const handleSoundTap = async (group: string) => {
    setPlayingGroup(group);
    // Play the first (primary) grapheme in the group
    await playPhoneme(group.split('/')[0]);
    setPlayingGroup(null);
  };

  return (
    <div className="flex flex-col h-full px-5 py-5 overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Level {level} Sounds</h2>
      <p className="text-base text-slate-500 mb-4">Pink = this book · Tap any sound to hear it!</p>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
        {page.allSounds.map((group) => {
          const sounds = group.split('/');
          const isFocus = sounds.some(s => page.focusSounds.includes(s));
          const isPlaying = playingGroup === group;
          return (
            <button key={group} onClick={() => handleSoundTap(group)}
              className={`py-2.5 px-1 rounded-xl text-sm font-bold transition-all duration-200 leading-tight
                ${isPlaying ? 'bg-pink-500 text-white scale-110 shadow-lg'
                  : isFocus ? 'bg-pink-100 text-pink-700 border-2 border-pink-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
            >
              {sounds.join(' / ')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vocab Preview ──────────────────────────────────────────────────────────

function VocabPreviewPage({ page }: { page: Extract<InteractivePage, { type: 'vocab_preview' }> }) {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full px-5 py-4 overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Story Words</h2>
      <p className="text-base text-slate-500 mb-4">Tap a word to hear it!</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {page.words.map((w, i) => {
          const isActive = playing === w.word;
          return (
            <button key={i}
              onClick={async () => {
                if (playing) return;
                setPlaying(w.word);
                await playWordAsPhonemes(w.word);
                setPlaying(null);
              }}
              className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200
                ${isActive ? 'border-pink-400 bg-pink-50 scale-105 shadow-md'
                  : 'border-slate-200 bg-white hover:border-pink-200 shadow-sm'}`}
            >
              <img
                src={`/images/words/${w.word}.png`}
                alt={w.word}
                className="w-14 h-14 object-contain mb-2"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              {w.isTricky ? (
                <>
                  <span className="text-lg font-bold text-slate-800">{w.word}</span>
                  <span className="text-xs text-slate-400 mt-0.5">tricky word</span>
                </>
              ) : (
                <div className="flex gap-1 justify-center flex-wrap">
                  {w.phonemes.map((ph, pi) => (
                    <div key={pi} className="flex flex-col items-center">
                      <span className="text-base font-bold leading-tight text-slate-800">{ph}</span>
                      <div className="w-1.5 h-1.5 rounded-full mt-0.5 bg-slate-500" />
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Story Page ─────────────────────────────────────────────────────────────

function StoryPage({ page, focusSounds, level = 1 }: { page: Extract<InteractivePage, { type: 'story' }>; focusSounds: string[]; level?: number }) {
  const [isNarrating, setIsNarrating] = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);
  const timersRef = useRef<number[]>([]);

  const handleNarrate = useCallback(() => {
    if (isNarrating) return;
    setIsNarrating(true); setActiveWordIdx(0);
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    const wc = page.words.length;

    let d = 0;
    for (let i = 0; i < wc; i++) {
      timersRef.current.push(window.setTimeout(() => setActiveWordIdx(i), d));
      d += 800;
    }
    timersRef.current.push(window.setTimeout(() => { setActiveWordIdx(null); setIsNarrating(false); }, d + 300));
  }, [isNarrating, page.words]);

  useEffect(() => () => { timersRef.current.forEach(t => clearTimeout(t)); }, []);

  // Level-based sizing: font gets smaller and spacing tighter as levels increase
  // L1-2: large & spacious (beginner readers), L3-4: medium, L5-6: compact (approaching normal reading)
  const wordSize: 'large' | 'medium' | 'normal' = level <= 2 ? 'large' : level <= 4 ? 'medium' : 'normal';
  const gapClass = level <= 2 ? 'gap-x-1 md:gap-x-2 gap-y-1' : level <= 4 ? 'gap-x-0.5 md:gap-x-1 gap-y-0.5' : 'gap-x-0 md:gap-x-0.5 gap-y-0';
  const textPad = level <= 2 ? 'px-4 md:px-8 lg:px-10' : level <= 4 ? 'px-3 md:px-6 lg:px-8' : 'px-2 md:px-4 lg:px-6';
  // Higher levels get a slightly bigger image since text is more compact
  const imgSize = level <= 2
    ? 'w-[240px] h-[240px] md:w-[340px] md:h-[340px] lg:w-[420px] lg:h-[420px]'
    : level <= 4
      ? 'w-[180px] h-[180px] md:w-[280px] md:h-[280px] lg:w-[340px] lg:h-[340px]'
      : 'w-[160px] h-[160px] md:w-[240px] md:h-[240px] lg:w-[300px] lg:h-[300px]';

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Expanded image overlay */}
      {imageExpanded && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setImageExpanded(false)}>
          <div className="relative max-w-[90vw] max-h-[85vh]">
            <img src={page.imageUrl} alt="Story illustration" className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl object-contain" />
            <button onClick={(e) => { e.stopPropagation(); setImageExpanded(false); }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white/80 hover:bg-white/30 hover:text-white transition-all shadow-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── DESKTOP: image left, text+button right ── */}
      {/* Image */}
      <div className="hidden md:flex md:items-center md:justify-center md:flex-none md:p-4 md:h-full">
        <button onClick={() => setImageExpanded(true)} className={`${imgSize} rounded-3xl overflow-hidden shadow-xl flex-shrink-0 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-200`}>
          <img src={page.imageUrl} alt="Story illustration" className="w-full h-full object-cover" draggable={false} />
        </button>
      </div>

      {/* ── MOBILE: text centred between header & button, button+image at bottom ── */}
      {/* ── DESKTOP: text+button right column centred ── */}
      <div className="flex flex-col flex-1 h-full items-center justify-center md:justify-center">
        {/* Mobile top spacer — pushes text to vertical centre between header and button */}
        <div className="flex-1 md:hidden" />

        {/* Text */}
        <div className={`flex items-center justify-center ${textPad} py-2 md:py-4 flex-shrink-0`}>
          <div className={`flex flex-wrap items-end justify-center ${gapClass}`}>
            {page.words.map((w, i) => (
              <div key={i} className={`transition-transform duration-150 ${activeWordIdx === i ? '-translate-y-1 md:-translate-y-2' : ''}`}>
                <TappableWord wordData={w} focusSounds={focusSounds} size={wordSize} highlight={activeWordIdx === i} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile bottom spacer — equal to top spacer so text is centred above button */}
        <div className="flex-1 md:hidden" />

        {/* Read to me button */}
        <div className={`${textPad} py-1 md:py-2 flex-shrink-0 w-full`}>
          <button onClick={handleNarrate} disabled={isNarrating}
            className={`w-full py-2 md:py-3.5 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all duration-200
              ${isNarrating ? 'bg-pink-500 text-white animate-pulse' : 'bg-pink-100 text-pink-700 hover:bg-pink-200 active:scale-[0.98]'}`}>
            <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> {isNarrating ? 'Reading...' : 'Read to me'}
          </button>
        </div>

        {/* Mobile image (below button, pinned at bottom) */}
        <div className="md:hidden flex items-center justify-center p-2 flex-shrink-0">
          <button onClick={() => setImageExpanded(true)} className={`${imgSize} rounded-2xl overflow-hidden shadow-lg flex-shrink-0 cursor-pointer hover:shadow-2xl active:scale-[0.98] transition-all duration-200`}>
            <img src={page.imageUrl} alt="Story illustration" className="w-full h-full object-cover" draggable={false} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sound Spotlight (redesigned — clean centered layout) ───────────────────

function SoundSpotlightPage({ page }: { page: Extract<InteractivePage, { type: 'sound_spotlight' }> }) {
  const [playingItem, setPlayingItem] = useState<string | null>(null);
  const [playingSound, setPlayingSound] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-6 gap-6">
      {/* Big tappable letter */}
      <button
        onClick={async () => { setPlayingSound(true); await playPhoneme(page.sound); setPlayingSound(false); }}
        className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center
          text-6xl md:text-7xl font-bold transition-all duration-200 leading-none
          ${playingSound ? 'bg-pink-500 text-white scale-110 ring-4 ring-pink-300 animate-pulse'
            : 'bg-pink-100 text-pink-600 hover:bg-pink-200 shadow-lg'}`}
        aria-label={`Play sound ${page.sound}`}
      >
        {page.sound}
      </button>
      <p className="text-sm text-slate-400 -mt-3">Tap the sound!</p>

      {/* Word cards — 2x2 grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {page.items.map((item) => {
          const isActive = playingItem === item.word;
          return (
            <button key={item.word}
              onClick={async () => { setPlayingItem(item.word); await playWordAsPhonemes(item.word); setPlayingItem(null); }}
              className={`flex flex-col items-center py-5 px-4 rounded-2xl border-2 transition-all duration-200
                ${isActive ? 'border-pink-400 bg-pink-50 scale-105 shadow-lg' : 'border-slate-200 bg-white hover:border-pink-200 shadow-sm'}`}>
              <img src={item.imageUrl} alt={item.word} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-3" />
              <span className="text-2xl md:text-3xl font-bold">
                {splitDigraphs(item.word).map((ch, ci) => (
                  <span key={ci} className={ci === item.focusIndex ? 'text-pink-600' : 'text-slate-700'}>{ch}</span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Word Reading ───────────────────────────────────────────────────────────

function WordReadingPage({ page, focusSounds }: { page: Extract<InteractivePage, { type: 'word_reading' }>; focusSounds: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-5 py-5">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Can You Read These?</h2>
      <p className="text-base text-slate-500 mb-8">Tap each word to hear it!</p>
      <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        {page.words.map((w, i) => (
          <div key={i} className="flex justify-center">
            <TappableWord wordData={w} focusSounds={focusSounds} size="large" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tricky Words (redesigned — nicer cards) ────────────────────────────────

function TrickyWordsPage({ page }: { page: Extract<InteractivePage, { type: 'tricky_words' }> }) {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center justify-center h-full px-5 py-5">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
        <h2 className="text-2xl font-bold text-slate-800">Tricky Words</h2>
        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
      </div>
      <p className="text-base text-slate-500 mb-6">These words don't sound how they look!</p>
      <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
        {page.words.map((w, i) => {
          const isActive = playing === w.word;
          return (
            <button key={i}
              onClick={() => setPlaying(isActive ? null : w.word)}
              className={`py-5 rounded-2xl text-3xl font-bold border-2 transition-all duration-200
                ${isActive ? 'border-purple-400 bg-purple-100 text-purple-700 scale-105 shadow-lg'
                  : 'border-purple-200 bg-white text-slate-700 hover:border-purple-300 shadow-sm'}`}>
              {w.display}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Nonsense / Alien Words (redesigned — boxed words) ──────────────────────

function NonsenseWordsPage({ page, focusSounds }: { page: Extract<InteractivePage, { type: 'nonsense_words' }>; focusSounds: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-5 py-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-6 h-6 text-green-500" />
        <h2 className="text-2xl font-bold text-slate-800">Alien Words</h2>
        <Sparkles className="w-6 h-6 text-green-500" />
      </div>
      <p className="text-base text-slate-500 mb-6 text-center">Not real words! Sound them out.</p>
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {page.words.map((w, i) => (
          <div key={i} className="bg-green-50 border-2 border-green-200 rounded-2xl p-3 flex justify-center shadow-sm hover:border-green-300 transition-colors">
            <TappableWord wordData={w} focusSounds={focusSounds} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Comprehension Quiz ─────────────────────────────────────────────────────

function QuizPage({ page }: { page: Extract<InteractivePage, { type: 'quiz' }> }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(false);

  const q = page.questions[qIdx];
  const isLast = qIdx === page.questions.length - 1;

  const handleSelect = (oi: number) => {
    if (selected !== null) return;
    setSelected(oi);
    setCorrect(q.options[oi].isCorrect);
  };

  const handleNext = () => {
    if (isLast) return;
    setQIdx(i => i + 1);
    setSelected(null);
    setCorrect(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-6">
      <p className="text-sm text-pink-500 font-bold mb-2">Question {qIdx + 1} of {page.questions.length}</p>
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center">{q.question}</h2>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {q.options.map((opt, oi) => {
          const isThis = selected === oi;
          const showCorrect = selected !== null && opt.isCorrect;
          const showWrong = isThis && !opt.isCorrect;
          return (
            <button key={oi} onClick={() => handleSelect(oi)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200 text-xl font-bold
                ${showCorrect ? 'border-green-400 bg-green-50 text-green-700'
                  : showWrong ? 'border-red-300 bg-red-50 text-red-600'
                  : selected !== null ? 'border-slate-200 bg-slate-50 text-slate-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-pink-300 hover:bg-pink-50'}`}>
              {opt.imageUrl && <img src={opt.imageUrl} alt={opt.label} className="w-10 h-10 object-contain flex-shrink-0" />}
              <span>{opt.label}</span>
              {showCorrect && <Check className="w-6 h-6 text-green-500 ml-auto" />}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mt-6">
          {correct ? (
            <p className="text-green-600 font-bold text-lg mb-3">Well done! &#11088;</p>
          ) : (
            <p className="text-amber-600 font-bold text-lg mb-3">Not quite — the green one is right!</p>
          )}
          {!isLast && (
            <button onClick={handleNext}
              className="px-6 py-3 rounded-2xl bg-pink-500 text-white font-bold text-base hover:bg-pink-600 transition-colors">
              Next Question &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spelling — drag letters into boxes ─────────────────────────────────────

function SpellingPage({ page }: { page: Extract<InteractivePage, { type: 'spelling' }> }) {
  const [wordIdx, setWordIdx] = useState(0);
  const w = page.words[wordIdx];
  const isLast = wordIdx === page.words.length - 1;

  // Shuffle available letters (include some distractors)
  const [available, setAvailable] = useState<string[]>([]);
  const [placed, setPlaced] = useState<(string | null)[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);

  const resetWord = useCallback((wi: number) => {
    const word = page.words[wi];
    const distractors = ['b', 'g', 'o', 'e', 'r', 'd'].filter(l => !word.letters.includes(l)).slice(0, 2);
    const all = [...word.letters, ...distractors];
    // Shuffle
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    setAvailable(all);
    setPlaced(word.letters.map(() => null));
    setIsCorrect(false);
  }, [page.words]);

  useEffect(() => { resetWord(wordIdx); }, [wordIdx, resetWord]);

  const handleLetterTap = (letter: string, fromIdx: number) => {
    if (isCorrect) return;
    // Find first empty slot
    const slotIdx = placed.indexOf(null);
    if (slotIdx === -1) return;
    const newPlaced = [...placed];
    newPlaced[slotIdx] = letter;
    setPlaced(newPlaced);
    const newAvail = [...available];
    newAvail.splice(fromIdx, 1);
    setAvailable(newAvail);
    // Check if complete and correct
    if (!newPlaced.includes(null)) {
      setIsCorrect(newPlaced.join('') === w.word);
      if (newPlaced.join('') !== w.word) {
        // Wrong — reset after a moment
        setTimeout(() => resetWord(wordIdx), 1200);
      }
    }
  };

  const handleSlotTap = (slotIdx: number) => {
    if (isCorrect) return;
    const letter = placed[slotIdx];
    if (!letter) return;
    const newPlaced = [...placed];
    newPlaced[slotIdx] = null;
    setPlaced(newPlaced);
    setAvailable([...available, letter]);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-6 gap-6">
      <h2 className="text-2xl font-bold text-slate-800">Spell the Word!</h2>
      <img src={w.imageUrl} alt={w.word} className="w-28 h-28 object-contain" />

      {/* Letter slots */}
      <div className="flex gap-3">
        {placed.map((letter, si) => (
          <button key={si} onClick={() => handleSlotTap(si)}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl border-3 flex items-center justify-center text-3xl md:text-4xl font-bold transition-all duration-200
              ${letter ? (isCorrect ? 'border-green-400 bg-green-50 text-green-700' : 'border-pink-400 bg-pink-50 text-pink-700')
                : 'border-dashed border-slate-300 bg-white text-slate-300'}`}>
            {letter || '?'}
          </button>
        ))}
      </div>

      {isCorrect && <p className="text-green-600 font-bold text-xl">&#11088; Correct!</p>}

      {/* Available letters */}
      <div className="flex gap-2 flex-wrap justify-center">
        {available.map((letter, li) => (
          <button key={li} onClick={() => handleLetterTap(letter, li)}
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 text-2xl md:text-3xl font-bold text-amber-800 hover:bg-amber-200 hover:scale-105 transition-all duration-200 shadow-sm">
            {letter}
          </button>
        ))}
      </div>

      {isCorrect && !isLast && (
        <button onClick={() => setWordIdx(i => i + 1)}
          className="px-6 py-3 rounded-2xl bg-pink-500 text-white font-bold text-base hover:bg-pink-600 transition-colors">
          Next Word &rarr;
        </button>
      )}
    </div>
  );
}

// ─── Story Ordering (numbers outside images, tighter layout) ────────────────

function StoryOrderingPage({ page }: { page: Extract<InteractivePage, { type: 'story_ordering' }> }) {
  const [items, setItems] = useState<OrderingItem[]>(() => {
    const s = [...page.items];
    for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
    return s;
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const checkCorrect = (arr: OrderingItem[]) => setIsCorrect(arr.every((it, i) => it.correctIndex === i));

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const n = [...items]; const [d] = n.splice(dragIdx, 1); n.splice(i, 0, d);
    setItems(n); setDragIdx(i);
  };
  const handleDragEnd = () => { setDragIdx(null); checkCorrect(items); };

  const handleTap = (i: number) => {
    if (selectedIdx === null) { setSelectedIdx(i); }
    else { if (selectedIdx !== i) { const n = [...items]; [n[selectedIdx], n[i]] = [n[i], n[selectedIdx]]; setItems(n); checkCorrect(n); } setSelectedIdx(null); }
  };

  const handleReset = () => {
    const s = [...page.items];
    for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
    setItems(s); setIsCorrect(false); setSelectedIdx(null);
  };

  return (
    <div className="flex flex-col h-full px-5 py-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Put the Story in Order!</h2>
      <p className="text-sm text-slate-500 mb-3">Tap two to swap them.</p>

      {isCorrect && (
        <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-green-100 rounded-2xl">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-bold text-sm">That's the right order!</span>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 flex-1">
        {items.map((item, i) => (
          <div key={item.correctIndex} draggable onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)} onDragEnd={handleDragEnd} onClick={() => handleTap(i)}
            className={`flex flex-col items-center cursor-grab select-none transition-all duration-200
              ${dragIdx === i ? 'opacity-50 scale-95' : ''} ${selectedIdx === i ? 'scale-105' : ''}`}>
            {/* Number ABOVE the image */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1
              ${isCorrect && item.correctIndex === i ? 'bg-green-500 text-white' : selectedIdx === i ? 'bg-pink-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {i + 1}
            </div>
            <div className={`w-full rounded-2xl border-2 overflow-hidden transition-colors
              ${selectedIdx === i ? 'border-pink-400 ring-2 ring-pink-300' : isCorrect && item.correctIndex === i ? 'border-green-400' : 'border-slate-200'}`}>
              <img src={item.imageUrl} alt={item.label} className="w-full aspect-square object-cover" draggable={false} />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-center leading-tight">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-2">
        <button onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">
          <RotateCcw className="w-4 h-4" /> Shuffle
        </button>
      </div>
    </div>
  );
}

// ─── Drawing Canvas ─────────────────────────────────────────────────────────

function DrawingCanvas({ prompt }: { prompt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [color, setColor] = useState('#e91e63');
  const colors = ['#e91e63', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#333333'];

  const getCtx = () => canvasRef.current?.getContext('2d');
  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return null;
    const r = c.getBoundingClientRect(), sx = c.width / r.width, sy = c.height / r.height;
    if ('touches' in e) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); isDrawing.current = true;
    const ctx = getCtx(), pos = getPos(e);
    if (ctx && pos) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  };
  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); if (!isDrawing.current) return;
    const ctx = getCtx(), pos = getPos(e);
    if (ctx && pos) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
  };
  const endDraw = () => { isDrawing.current = false; };
  const clearCanvas = () => { const c = canvasRef.current, ctx = getCtx(); if (c && ctx) ctx.clearRect(0, 0, c.width, c.height); };
  useEffect(() => { const c = canvasRef.current; if (c) { c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; } }, []);

  return (
    <div className="flex flex-col h-full px-5 py-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-3">{prompt}</h2>
      <div className="flex items-center gap-2.5 mb-3">
        {colors.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-9 h-9 rounded-full transition-all ${color === c ? 'ring-3 ring-offset-2 ring-slate-400 scale-110' : ''}`}
            style={{ backgroundColor: c }} />
        ))}
        <button onClick={clearCanvas} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-base font-medium hover:bg-slate-200">
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>
      <canvas ref={canvasRef} className="flex-1 rounded-2xl border-2 border-dashed border-slate-300 bg-white touch-none cursor-crosshair"
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} />
    </div>
  );
}

// ─── Writing Practice ───────────────────────────────────────────────────────

function WritingPracticePage({ page }: { page: Extract<InteractivePage, { type: 'writing_practice' }> }) {
  const [activeIdx, setActiveIdx] = useState(0);
  return (
    <div className="flex flex-col h-full px-5 py-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Writing Practice</h2>
      <p className="text-base text-slate-500 mb-4">Tap a letter, then trace it!</p>
      <div className="flex gap-3 mb-4">
        {page.letters.map((letter, i) => (
          <button key={i} onClick={async () => { setActiveIdx(i); await playPhoneme(letter); }}
            className={`flex-1 py-4 rounded-2xl text-3xl font-bold transition-all duration-200
              ${i === activeIdx ? 'bg-pink-500 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {letter}
          </button>
        ))}
      </div>
      <div className="flex-1 relative rounded-2xl border-2 border-dashed border-slate-300 bg-white overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[14rem] font-bold text-slate-200/60 select-none">{page.letters[activeIdx]}</span>
        </div>
        <WritingCanvas key={`${page.letters[activeIdx]}-${activeIdx}`} />
      </div>
    </div>
  );
}

function WritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const getCtx = () => canvasRef.current?.getContext('2d');
  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return null;
    const r = c.getBoundingClientRect(), sx = c.width / r.width, sy = c.height / r.height;
    if ('touches' in e) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  const start = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); isDrawing.current = true;
    const ctx = getCtx(), pos = getPos(e);
    if (ctx && pos) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.strokeStyle = '#e91e63'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  };
  const move = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); if (!isDrawing.current) return;
    const ctx = getCtx(), pos = getPos(e);
    if (ctx && pos) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
  };
  const end = () => { isDrawing.current = false; };
  useEffect(() => { const c = canvasRef.current; if (c) { c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; } }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
      onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} />
  );
}

// ─── Certificate ────────────────────────────────────────────────────────────

function CertificatePage({ page }: { page: Extract<InteractivePage, { type: 'certificate' }> }) {
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => { setShowConfetti(true); const t = setTimeout(() => setShowConfetti(false), 3000); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute w-3 h-3 rounded-sm animate-bounce"
              style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`,
                backgroundColor: ['#e91e63','#2196f3','#4caf50','#ff9800','#9c27b0','#ffeb3b'][i%6],
                animationDelay: `${Math.random()*2}s`, animationDuration: `${1+Math.random()*2}s`, opacity: 0.8 }} />
          ))}
        </div>
      )}
      <div className="bg-white rounded-3xl border-4 border-pink-400 p-10 shadow-2xl max-w-sm w-full">
        <div className="text-6xl mb-4">&#11088;</div>
        <h1 className="text-3xl font-bold text-pink-600 mb-2">I Read a Book!</h1>
        <p className="text-base text-slate-500 mb-3">Reading Star Certificate</p>
        <p className="text-2xl font-bold italic text-slate-700 mb-4">{page.bookTitle}</p>
        <div className="border-t-2 border-dashed border-slate-200 pt-4 mt-4">
          <p className="text-sm text-slate-400">MyPhonicsBooks</p>
        </div>
      </div>
      <p className="text-pink-600 font-bold mt-8 text-xl">Well done!</p>
    </div>
  );
}

// ─── Main Reader ────────────────────────────────────────────────────────────

interface InteractiveBookReaderProps { book: Book; onClose: () => void; onFinish: () => void; }
const levelColors: Record<number, string> = { 1:'bg-level-1', 2:'bg-level-2', 3:'bg-level-3', 4:'bg-level-4', 5:'bg-level-5', 6:'bg-level-6' };
const SWIPE_THRESHOLD = 50;

export default function InteractiveBookReader({ book, onClose, onFinish }: InteractiveBookReaderProps) {
  const pages = INTERACTIVE_BOOKS[book.subLevel] ?? [];
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const totalPages = pages.length;
  const levelBg = levelColors[book.level] || 'bg-primary';

  const goNext = useCallback(() => { if (currentPage < totalPages - 1) setCurrentPage(p => p + 1); else onFinish(); }, [currentPage, totalPages, onFinish]);
  const goPrev = useCallback(() => { if (currentPage > 0) setCurrentPage(p => p - 1); }, [currentPage]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [goNext, goPrev, onClose]);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const pageData = pages[currentPage];
  const isCanvasPage = pageData?.type === 'drawing' || pageData?.type === 'writing_practice';

  const handleTouchStart = (e: React.TouchEvent) => { if (isCanvasPage) return; touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isCanvasPage || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current, dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) { if (dx < 0) goNext(); else goPrev(); }
    touchStartX.current = null; touchStartY.current = null;
  };

  const isFirst = currentPage === 0, isLast = currentPage === totalPages - 1;

  const renderPage = () => {
    const p = pages[currentPage]; if (!p) return null;
    const fs = book.focusSounds;
    switch (p.type) {
      case 'cover': return <CoverPage page={p} />;
      case 'sound_grid': return <SoundGridPage page={p} level={book.level} />;
      case 'vocab_preview': return <VocabPreviewPage page={p} />;
      case 'story': return <StoryPage page={p} focusSounds={fs} level={book.level} />;
      case 'sound_spotlight': return <SoundSpotlightPage page={p} />;
      case 'word_reading': return <WordReadingPage page={p} focusSounds={fs} />;
      case 'tricky_words': return <TrickyWordsPage page={p} />;
      case 'writing_practice': return <WritingPracticePage page={p} />;
      case 'drawing': return <DrawingCanvas prompt={p.prompt} />;
      case 'nonsense_words': return <NonsenseWordsPage page={p} focusSounds={fs} />;
      case 'story_ordering': return <StoryOrderingPage page={p} />;
      case 'quiz': return <QuizPage page={p} />;
      case 'spelling': return <SpellingPage page={p} />;
      case 'certificate': return <CertificatePage page={p} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-amber-50 flex flex-col" style={{ ...ANDIKA, isolation: 'isolate' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className={`flex items-center justify-between px-4 py-2 ${levelBg} z-10 shrink-0`}>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30" aria-label="Close book">
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white font-semibold text-base truncate max-w-[240px]">{book.title}</h2>
        <span className="text-white/80 text-sm font-medium min-w-[50px] text-right">{currentPage + 1} / {totalPages}</span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {renderPage()}
        {!isFirst && <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/70 shadow-lg items-center justify-center hover:bg-white z-20 hidden md:flex" aria-label="Previous page"><ChevronLeft className="w-6 h-6 text-slate-700" /></button>}
        {!isLast && <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/70 shadow-lg items-center justify-center hover:bg-white z-20 hidden md:flex" aria-label="Next page"><ChevronRight className="w-6 h-6 text-slate-700" /></button>}
      </div>

      <div className="flex items-center justify-center gap-1 py-2.5 bg-white/90 backdrop-blur-sm shrink-0">
        <button onClick={goPrev} disabled={isFirst} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20 mr-2"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
        <div className="w-40 md:w-56 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${levelBg} rounded-full transition-all duration-300`}
            style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }} />
        </div>
        <span className="text-xs text-slate-400 font-medium ml-2 min-w-[40px]">{currentPage + 1}/{totalPages}</span>
        <button onClick={goNext} className={`p-2 rounded-lg transition-colors ml-2 ${isLast ? `${levelBg} text-white rounded-xl px-4` : 'hover:bg-slate-100 text-slate-600'}`}>
          {isLast ? <span className="text-base font-bold">Finish</span> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
