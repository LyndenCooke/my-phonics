import { useState, useCallback } from 'react';
import { QuizQuestion } from '@/lib/types';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trans, useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface ComprehensionQuizProps {
  questions: QuizQuestion[];
  bookId: string;
  bookTitle: string;
  levelColor: string;
  onComplete: (score: number, total: number) => void;
  onClose: () => void;
}

export default function ComprehensionQuiz({
  questions, bookId, bookTitle, levelColor, onComplete, onClose,
}: ComprehensionQuizProps) {
  const { t } = useTranslation('reader');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [answers, setAnswers] = useState<Array<{ questionId: string; selected: string; correct: boolean }>>([]);

  const question = questions[currentIndex];
  const isCorrect = selected === question?.correctAnswer;

  const saveQuizAttempt = useCallback(async (finalScore: number, totalQuestions: number, questionAnswers: typeof answers) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Not logged in, skip saving
        return true;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-quiz-attempt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            book_id: bookId,
            score: finalScore,
            total_questions: totalQuestions,
            answers: questionAnswers.map(a => ({
              question_id: a.questionId,
              selected_answer: a.selected,
              is_correct: a.correct,
            })),
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to save quiz:', error);
        toast.error(i18n.t('reader:quiz.saveFailed'));
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error saving quiz:', err);
      toast.error(i18n.t('reader:quiz.saveFailed'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [bookId]);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    const correct = option === question.correctAnswer;
    if (correct) {
      setScore((s) => s + 1);
    }
    setAnswers(prev => [...prev, { 
      questionId: question.id, 
      selected: option, 
      correct 
    }]);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      const finalScore = score + (isCorrect ? 1 : 0);
      const saved = await saveQuizAttempt(finalScore, questions.length, [
        ...answers, 
        { questionId: question.id, selected: selected!, correct: isCorrect }
      ]);
      
      if (saved) {
        setFinished(true);
        onComplete(finalScore, questions.length);
      }
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPerfect = score === questions.length;
    
    return (
      <div 
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8 text-center"
        role="dialog"
        aria-modal="true"
        aria-label={t('quiz.completeAria')}
      >
        <div className={`w-20 h-20 rounded-2xl ${isPerfect ? 'bg-tint-green' : 'bg-tint-pink'} flex items-center justify-center mb-4`}>
          <Star className={`w-10 h-10 ${isPerfect ? 'text-level-3' : 'text-primary'}`} />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">
          {isPerfect ? t('quiz.perfect') : t('quiz.wellDone')}
        </h2>
        <p className="text-muted-foreground mb-2">
          <Trans
            t={t}
            i18nKey="quiz.scored"
            values={{ score, total: questions.length }}
            components={{ b: <span className="font-extrabold text-foreground" /> }}
          />
          <span className="text-sm text-muted-foreground ms-1">({percentage}%)</span>
        </p>
        <p dir="ltr" lang="en" className="text-sm text-muted-foreground mb-6">{bookTitle}</p>

        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-foreground font-bold text-sm shadow-card active:scale-[0.97] transition-transform duration-200 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {t('quiz.tryAgain')}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-3 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform duration-200 disabled:opacity-50"
          >
            {t('common:actions.done')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-background flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={t('quiz.dialogAria', { title: bookTitle })}
    >
      <div className="px-4 py-3 border-b border-border bg-card shadow-card flex items-center justify-between">
        <button 
          onClick={onClose} 
          className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t('quiz.close')}
        >
          {t('common:actions.close')}
        </button>
        <span dir="ltr" className="text-xs font-bold text-muted-foreground">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* The question, answers and feedback are the child's reading —
          English, LTR. Only the chrome around them is translated. */}
      <div dir="ltr" lang="en" className="flex-1 flex flex-col items-center justify-center px-6">
        <p 
          className="font-child text-xl font-bold text-foreground text-center mb-8 leading-relaxed"
          aria-live="polite"
        >
          {question.questionText}
        </p>

        <div 
          className="w-full max-w-sm space-y-3"
          role="radiogroup"
          aria-label={t('quiz.answerOptions')}
        >
          {question.options.map((option) => {
            let optionStyle = 'bg-card border border-border text-foreground shadow-card';
            if (showResult && option === question.correctAnswer) {
              optionStyle = 'bg-tint-green border-2 border-level-3 text-foreground shadow-card';
            } else if (showResult && option === selected && !isCorrect) {
              optionStyle = 'bg-tint-orange border-2 border-destructive text-foreground shadow-card';
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl font-child text-lg font-semibold text-center transition-all duration-200 ${optionStyle} ${
                  !showResult ? 'hover:shadow-card-hover active:scale-[0.98]' : ''
                }`}
                role="radio"
                aria-checked={selected === option}
                aria-disabled={showResult}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && option === question.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-level-3" aria-hidden="true" />
                  )}
                  {showResult && option === selected && !isCorrect && option !== question.correctAnswer && (
                    <XCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div 
            className="mt-6 animate-slide-up"
            aria-live="polite"
          >
            <p dir="auto" lang={i18n.language} className={`text-center font-bold mb-4 ${isCorrect ? 'text-level-3' : 'text-destructive'}`}>
              {isCorrect ? t('quiz.brilliant') : t('quiz.nearly')}
            </p>
            <button
              onClick={handleNext}
              disabled={isSaving}
              dir={i18n.dir()}
              lang={i18n.language}
              className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold mx-auto shadow-button active:scale-[0.97] transition-transform duration-200 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {currentIndex < questions.length - 1 ? t('common:actions.next') : t('quiz.seeResults')}
                  <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
