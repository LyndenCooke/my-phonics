import { useState } from 'react';
import { Check, X, Volume2, ArrowRight } from 'lucide-react';
import { SCREENING_WORDS, calculateStartLevel } from '@/lib/adaptiveEngine';
import { useTranslation } from 'react-i18next';
import EnglishOnly from '@/i18n/EnglishOnly';

const LEVEL_COLOURS: Record<number, string> = {
  1: '#E84B8A', 2: '#F5A623', 3: '#4ABD6D',
  4: '#5B9EFF', 5: '#A78EFF', 6: '#2B8A6E',
};

interface QuickScreeningProps {
  childName: string;
  onComplete: (level: number) => void;
  onBack: () => void;
}

export default function QuickScreening({ childName, onComplete, onBack }: QuickScreeningProps) {
  const { t } = useTranslation('funnels');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checks, setChecks] = useState<Record<number, boolean>>({});

  const currentWord = SCREENING_WORDS[currentIndex];
  const total = SCREENING_WORDS.length;
  const progress = ((currentIndex) / total) * 100;

  const handleAnswer = (correct: boolean) => {
    const newChecks = { ...checks, [currentWord.level]: correct ? (checks[currentWord.level] !== false) : false };

    if (currentIndex + 1 >= total) {
      // All words done — calculate level
      const level = calculateStartLevel(newChecks);
      onComplete(level);
      return;
    }

    setChecks(newChecks);
    setCurrentIndex(currentIndex + 1);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.lang = 'en-GB';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1">
          {t('quickScreening.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {childName
            ? t('quickScreening.instructionsNamed', { name: childName })
            : t('quickScreening.instructionsAnon')}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: LEVEL_COLOURS[currentWord?.level || 1],
          }}
        />
      </div>

      {/* Word card */}
      <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-8 text-center mb-6">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
          {t('quickScreening.levelWord', { level: currentWord?.level })}
        </p>

        <div className="flex items-center justify-center gap-3 mb-6" dir="ltr">
          <EnglishOnly as="span" className="text-4xl sm:text-5xl font-bold text-foreground">
            {currentWord?.word}
          </EnglishOnly>
          <button
            onClick={() => speak(currentWord?.word || '')}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-muted-foreground transition-colors"
            title={t('quickScreening.hearWord')}
            aria-label={t('quickScreening.hearWord')}
          >
            <Volume2 size={18} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {t('quickScreening.progress', { current: currentIndex + 1, total })}
        </p>
      </div>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => handleAnswer(false)}
          className="py-4 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <X size={20} />
          {t('quickScreening.notQuite')}
        </button>
        <button
          onClick={() => handleAnswer(true)}
          className="py-4 bg-white border-2 border-green-200 text-green-600 font-semibold rounded-xl hover:bg-green-50 hover:border-green-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Check size={20} />
          {t('quickScreening.gotIt')}
        </button>
      </div>

      <button
        onClick={onBack}
        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('common:actions.back')}
      </button>
    </div>
  );
}
