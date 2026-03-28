import { useState, useCallback, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import type { StoryWord } from '@/lib/interactiveBookData';

/** Play an audio file, returning a promise that resolves when done */
function playAudioFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`Audio not found: ${url}`));
    audio.oncanplaythrough = () => { audio.play().catch(reject); };
    audio.load();
  });
}

/** Fallback: use browser speech synthesis */
function speakWord(word: string): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-GB';
    utterance.rate = 0.85;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    speechSynthesis.speak(utterance);
  });
}

/** Try mp3 file first, fall back to speech synthesis */
async function playWord(word: string): Promise<void> {
  const key = word.toLowerCase().replace(/\s+/g, '_');
  try {
    await playAudioFile(`/sounds/words/${key}.mp3`);
  } catch {
    await speakWord(word);
  }
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
  size?: 'normal' | 'large';
}

export default function TappableWord({ wordData, focusSounds = [], size = 'normal' }: TappableWordProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPhonemes, setShowPhonemes] = useState(false);
  const [activePhoneme, setActivePhoneme] = useState<number | null>(null);
  const [isSoundingOut, setIsSoundingOut] = useState(false);
  const cancelRef = useRef(false);

  const textSize = size === 'large' ? 'text-3xl' : 'text-2xl';

  const handleTapWord = useCallback(async () => {
    if (isPlaying || isSoundingOut) return;
    setIsPlaying(true);
    setShowPhonemes(true);
    await playWord(wordData.word);
    setIsPlaying(false);
  }, [wordData.word, isPlaying, isSoundingOut]);

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

    // Brief pause then blend the whole word
    if (!cancelRef.current) {
      await new Promise(r => setTimeout(r, 400));
      await playWord(wordData.word);
    }

    setIsSoundingOut(false);
  }, [wordData, isSoundingOut]);

  const handlePhonemeClick = useCallback(async (index: number) => {
    setActivePhoneme(index);
    await playPhoneme(wordData.phonemes[index]);
    setActivePhoneme(null);
  }, [wordData.phonemes]);

  return (
    <div className="inline-flex flex-col items-center mx-1 mb-2">
      {/* The tappable word */}
      <button
        onClick={handleTapWord}
        className={`
          ${textSize} font-bold rounded-xl px-3 py-1
          transition-all duration-200 select-none
          ${isPlaying
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
        <div className="flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
          {wordData.phonemes.map((ph, i) => {
            const isFocus = focusSounds.includes(ph);
            const isActive = activePhoneme === i;
            return (
              <button
                key={i}
                onClick={() => handlePhonemeClick(i)}
                className={`
                  w-8 h-8 rounded-full text-sm font-bold
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
              w-8 h-8 rounded-full flex items-center justify-center ml-1
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
