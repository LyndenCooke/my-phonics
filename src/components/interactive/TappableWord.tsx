import { useState, useCallback, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import type { StoryWord } from '@/lib/interactiveBookData';

function playAudioFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`Audio not found: ${url}`));
    audio.oncanplaythrough = () => { audio.play().catch(reject); };
    audio.load();
  });
}

async function playPhoneme(grapheme: string): Promise<void> {
  const key = grapheme.toLowerCase().replace(/-/g, '_');
  try {
    await playAudioFile(`/sounds/${key}.mp3`);
  } catch {
    // No fallback for phonemes — they need real audio
  }
}

interface TappableWordProps {
  wordData: StoryWord;
  focusSounds?: string[];
  size?: 'normal' | 'medium' | 'large';
  highlight?: boolean;  // External highlight (e.g. during narration)
}

export default function TappableWord({ wordData, focusSounds = [], size = 'normal', highlight = false }: TappableWordProps) {
  const [showPhonemes, setShowPhonemes] = useState(false);
  const [activePhoneme, setActivePhoneme] = useState<number | null>(null);
  const [isSoundingOut, setIsSoundingOut] = useState(false);
  const cancelRef = useRef(false);

  const textSize = size === 'large'
    ? 'text-3xl md:text-4xl lg:text-5xl'
    : size === 'medium'
      ? 'text-xl md:text-2xl lg:text-3xl'
      : 'text-base md:text-lg lg:text-xl';
  const wordPad = size === 'large' ? 'px-2 py-1 md:px-3' : size === 'medium' ? 'px-1.5 py-0.5' : 'px-1 py-0.5';
  const wordMargin = size === 'large' ? 'mx-0.5 mb-1.5 md:mx-1 md:mb-2' : size === 'medium' ? 'mx-0 mb-0.5 md:mx-0.5 md:mb-1' : 'mx-0 mb-0';

  const handleTapWord = useCallback(() => {
    if (isSoundingOut) return;
    setShowPhonemes(true);
  }, [isSoundingOut]);

  const handleSoundOut = useCallback(async () => {
    if (isSoundingOut || wordData.isTricky || wordData.phonemes.length === 0) return;
    cancelRef.current = false;
    setIsSoundingOut(true);

    // Play each phoneme sequentially with highlight
    for (let i = 0; i < wordData.phonemes.length; i++) {
      if (cancelRef.current) break;
      setActivePhoneme(i);
      await playPhoneme(wordData.phonemes[i]);
      // Small pause between phonemes
      await new Promise(r => setTimeout(r, 300));
    }
    setActivePhoneme(null);
    setIsSoundingOut(false);
  }, [wordData, isSoundingOut]);

  const handlePhonemeClick = useCallback(async (index: number) => {
    setActivePhoneme(index);
    await playPhoneme(wordData.phonemes[index]);
    setActivePhoneme(null);
  }, [wordData.phonemes]);

  return (
    <div className={`inline-flex flex-col items-center ${wordMargin}`}>
      {/* The tappable word */}
      <button
        onClick={handleTapWord}
        className={`
          ${textSize} font-bold rounded-xl ${wordPad}
          transition-all duration-200 select-none
          ${highlight
            ? 'text-pink-600 scale-110 bg-pink-100'
            : 'text-slate-800 hover:bg-pink-50 active:scale-95'
          }
          ${isSoundingOut ? 'bg-amber-50' : ''}
        `}
        aria-label={`Tap to hear "${wordData.word}"`}
      >
        {wordData.display}
      </button>

      {/* Phoneme breakdown (shown after tapping the word) */}
      {showPhonemes && wordData.phonemes.length > 0 && !wordData.isTricky && (
        <div className={`flex items-center gap-1 ${size === 'large' ? 'mt-1' : 'mt-0.5'} animate-in fade-in slide-in-from-top-1 duration-300`}>
          {wordData.phonemes.map((ph, i) => {
            const isFocus = focusSounds.includes(ph);
            const isActive = activePhoneme === i;
            const btnSize = size === 'large' ? 'w-10 h-10 text-base' : size === 'medium' ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-xs';
            return (
              <button
                key={i}
                onClick={() => handlePhonemeClick(i)}
                className={`
                  ${btnSize} rounded-full font-bold
                  flex items-center justify-center
                  transition-all duration-200
                  ${isActive
                    ? 'bg-pink-500 text-white scale-125 ring-2 ring-pink-300'
                    : isFocus
                      ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
                aria-label={`Phoneme ${ph}`}
              >
                {ph}
              </button>
            );
          })}

          {/* Sound-it-out button */}
          <button
            onClick={handleSoundOut}
            disabled={isSoundingOut}
            className={`
              ${size === 'large' ? 'w-10 h-10' : size === 'medium' ? 'w-8 h-8' : 'w-7 h-7'} rounded-full flex items-center justify-center ml-1
              transition-all duration-200
              ${isSoundingOut
                ? 'bg-amber-400 text-white animate-pulse'
                : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
              }
            `}
            aria-label="Sound it out"
            title="Sound it out"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tricky word badge */}
      {showPhonemes && wordData.isTricky && (
        <span className="text-xs text-purple-500 font-semibold mt-1 animate-in fade-in duration-300">
          tricky word ⭐
        </span>
      )}
    </div>
  );
}
