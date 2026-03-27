import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { PhonemePlayer } from '@/components/PhonemePlayer';
import { WordPlayer } from '@/components/WordPlayer';
import { SoundMap } from '@/components/SoundMap';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/useBooks';
import { LEVELS } from '@/lib/types';
import {
  ASSESSMENT_ITEMS,
  PASS_CRITERIA,
  AGE_EXPECTATIONS,
  LEVEL_NAMES,
  CATEGORY_LABELS,
  CATEGORY_INSTRUCTIONS,
  getCategoriesForLevel,
  getItems,
  type Category,
} from '@/lib/assessmentData';
import {
  SCREENING_WORDS,
  calculateStartLevel,
  isSmallCategory,
  getTrancheItems,
  evaluateTranche,
  checkLevelConfidence,
  getCategoryThreshold,
  buildSoundMap,
  type Answer,
  type LevelScore,
  type CategoryResult,
} from '@/lib/adaptiveEngine';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, ArrowRight, Trophy, AlertTriangle, Star, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

type Stage = 'welcome' | 'screening' | 'testing' | 'level-passed' | 'level-results' | 'final-results';

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};
const LEVEL_BORDERS: Record<number, string> = {
  1: 'border-level-1', 2: 'border-level-2', 3: 'border-level-3',
  4: 'border-level-4', 5: 'border-level-5', 6: 'border-level-6',
};
const LEVEL_TEXT: Record<number, string> = {
  1: 'text-level-1', 2: 'text-level-2', 3: 'text-level-3',
  4: 'text-level-4', 5: 'text-level-5', 6: 'text-level-6',
};

function getSoundKey(grapheme: string): string {
  const VARIANT_MAP: Record<string, string> = {
    'ow (blow)': 'ow', 'ow (cow)': 'ow',
    'oo (moon)': 'oo_moon', 'oo (look)': 'oo_look',
  };
  const lower = grapheme.toLowerCase().trim();
  if (VARIANT_MAP[lower]) return VARIANT_MAP[lower];
  const base = lower.replace(/\s*\(.*\)/, '').trim();
  return base.replace(/-/g, '_');
}

export default function Assessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: children } = useChildren();

  // Core state
  const [stage, setStage] = useState<Stage>('welcome');
  const [childAge, setChildAge] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [levelScores, setLevelScores] = useState<LevelScore[]>([]);

  // Screening
  const [screeningChecks, setScreeningChecks] = useState<Record<number, boolean>>({});
  const [startLevel, setStartLevel] = useState(1);

  // Testing
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0);
  const [currentTranche, setCurrentTranche] = useState(1);
  const [currentItemIdx, setCurrentItemIdx] = useState(0); // index within tranche items
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [trancheCorrect, setTrancheCorrect] = useState(0);
  const [cumulativeCorrect, setCumulativeCorrect] = useState(0);
  const [cumulativeTotal, setCumulativeTotal] = useState(0);
  const [completedCategories, setCompletedCategories] = useState<CategoryResult[]>([]);
  const [fluencyWpm, setFluencyWpm] = useState('');

  // Auto-advance timer
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);

  const categories = getCategoriesForLevel(currentLevel).filter(c => c !== 'fluency');
  const currentCategory = categories[currentCategoryIdx] as Category | undefined;
  const trancheItems = currentCategory
    ? getTrancheItems(currentLevel, currentCategory, currentTranche)
    : [];
  const currentItem = trancheItems[currentItemIdx];

  // Cleanup auto-advance timer
  useEffect(() => {
    return () => { if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer); };
  }, [autoAdvanceTimer]);

  // ─── Helpers ───────────────────────────────────────────────

  const finishCategory = useCallback((correct: number, total: number) => {
    if (!currentCategory) return;
    const threshold = getCategoryThreshold(currentLevel, currentCategory);
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = percentage >= threshold;

    const result: CategoryResult = {
      category: currentCategory,
      correct, total, percentage, passed,
    };

    const newCompleted = [...completedCategories, result];
    setCompletedCategories(newCompleted);

    // Check level confidence
    const confidence = checkLevelConfidence(newCompleted, categories.length);

    if (confidence === 'stop-fail') {
      // Level clearly failed — finish immediately
      finishLevel(newCompleted, false);
      return;
    }

    if (confidence === 'auto-pass') {
      // Level clearly passing — auto-pass remaining categories
      finishLevel(newCompleted, true);
      return;
    }

    // Continue to next category
    const nextIdx = currentCategoryIdx + 1;
    if (nextIdx < categories.length) {
      setCurrentCategoryIdx(nextIdx);
      setCurrentTranche(1);
      setCurrentItemIdx(0);
      setConsecutiveWrong(0);
      setTrancheCorrect(0);
      setCumulativeCorrect(0);
      setCumulativeTotal(0);
    } else {
      // All categories done
      finishLevel(newCompleted, newCompleted.every(c => c.passed));
    }
  }, [currentCategory, currentLevel, currentCategoryIdx, completedCategories, categories.length]);

  const finishLevel = (catResults: CategoryResult[], passed: boolean) => {
    const wpm = fluencyWpm ? parseInt(fluencyWpm) : undefined;

    const score: LevelScore = {
      level: currentLevel,
      categories: catResults,
      passed,
      fluencyWpm: wpm,
    };

    setLevelScores(prev => [...prev, score]);

    if (passed && currentLevel < 6) {
      // Show quick "Level passed!" then auto-advance
      setStage('level-passed');
    } else {
      // Failed or finished L6 → show results
      if (passed) {
        // Passed L6 — show final results
        setStage('final-results');
      } else {
        setStage('level-results');
      }
    }
  };

  const advanceToNextLevel = () => {
    setCurrentLevel(prev => prev + 1);
    setCurrentCategoryIdx(0);
    setCurrentTranche(1);
    setCurrentItemIdx(0);
    setConsecutiveWrong(0);
    setTrancheCorrect(0);
    setCumulativeCorrect(0);
    setCumulativeTotal(0);
    setCompletedCategories([]);
    setFluencyWpm('');
    setStage('testing');
  };

  const handleMark = useCallback((correct: boolean) => {
    if (!currentItem || !currentCategory) return;

    // Record answer
    const newAnswer: Answer = {
      level: currentLevel,
      category: currentCategory,
      item: currentItem.item,
      isCorrect: correct,
    };
    setAnswers(prev => [...prev, newAnswer]);

    // 3 consecutive wrong → skip category
    const newConsecWrong = correct ? 0 : consecutiveWrong + 1;
    setConsecutiveWrong(newConsecWrong);

    const newCumulativeCorrect = cumulativeCorrect + (correct ? 1 : 0);
    const newCumulativeTotal = cumulativeTotal + 1;
    setCumulativeCorrect(newCumulativeCorrect);
    setCumulativeTotal(newCumulativeTotal);

    if (newConsecWrong >= 3) {
      finishCategory(newCumulativeCorrect, newCumulativeTotal);
      return;
    }

    // Check if we've finished the current tranche
    const newTrancheCorrect = trancheCorrect + (correct ? 1 : 0);
    setTrancheCorrect(newTrancheCorrect);
    const trancheItemCount = trancheItems.length;

    if (currentItemIdx >= trancheItemCount - 1) {
      // End of tranche — evaluate
      const small = isSmallCategory(currentLevel, currentCategory);

      if (small) {
        // Small category: all items tested, finish
        finishCategory(newCumulativeCorrect, newCumulativeTotal);
        return;
      }

      const decision = evaluateTranche(
        currentTranche,
        newTrancheCorrect, trancheItemCount,
        newCumulativeCorrect, newCumulativeTotal,
      );

      if (decision === 'pass') {
        // Extrapolate: assume remaining items would be correct too
        const allItems = getItems(currentLevel, currentCategory);
        finishCategory(newCumulativeCorrect, newCumulativeTotal);
        return;
      }
      if (decision === 'fail') {
        finishCategory(newCumulativeCorrect, newCumulativeTotal);
        return;
      }

      // Continue to next tranche
      const nextTranche = currentTranche + 1;
      const nextTrancheItems = getTrancheItems(currentLevel, currentCategory, nextTranche);
      if (nextTrancheItems.length === 0) {
        // No more items
        finishCategory(newCumulativeCorrect, newCumulativeTotal);
        return;
      }
      setCurrentTranche(nextTranche);
      setCurrentItemIdx(0);
      setTrancheCorrect(0);
      return;
    }

    // Next item in tranche
    setCurrentItemIdx(i => i + 1);
  }, [currentItem, currentCategory, currentLevel, consecutiveWrong,
      cumulativeCorrect, cumulativeTotal, trancheCorrect, trancheItems.length,
      currentItemIdx, currentTranche, finishCategory]);

  const getRecommendedLevel = (): number => {
    const passedLevels = levelScores.filter(s => s.passed).map(s => s.level);
    // Include screened levels
    for (let l = 1; l < startLevel; l++) passedLevels.push(l);
    if (passedLevels.length === 0) return 1;
    const highest = Math.max(...passedLevels);
    return Math.min(highest + 1, 6);
  };

  const getAgeComparison = () => {
    if (!childAge) return null;
    return AGE_EXPECTATIONS.find(e => e.age === childAge);
  };

  const reset = () => {
    setStage('welcome');
    setChildAge('');
    setAnswers([]);
    setLevelScores([]);
    setScreeningChecks({});
    setStartLevel(1);
    setCurrentLevel(1);
    setCurrentCategoryIdx(0);
    setCurrentTranche(1);
    setCurrentItemIdx(0);
    setConsecutiveWrong(0);
    setTrancheCorrect(0);
    setCumulativeCorrect(0);
    setCumulativeTotal(0);
    setCompletedCategories([]);
    setFluencyWpm('');
  };

  // ═══════════════════════════════════════════════════════════
  // WELCOME SCREEN
  // ═══════════════════════════════════════════════════════════
  if (stage === 'welcome') {
    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
          <h2 className="text-[28px] font-extrabold text-foreground mb-2 tracking-tight">
            Phonics Assessment
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs mx-auto">
            Find your child's reading level in just a few minutes.
          </p>

          <div className="bg-tint-pink rounded-2xl p-5 mb-6 text-left">
            <p className="text-sm font-bold text-foreground mb-3">How it works</p>
            <div className="space-y-2.5">
              {[
                { icon: '1', label: 'Quick check', desc: 'Tick which words your child can read' },
                { icon: '2', label: 'Adaptive test', desc: 'We test sounds and words, skipping ahead when confident' },
                { icon: '3', label: 'Sound map', desc: 'See exactly which sounds they know (green) and need to learn (red)' },
              ].map(({ icon, label, desc }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-level-1 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <span className="text-xs font-bold text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground ml-1">— {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Age selector */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-foreground mb-2">Child's age (for UK comparison)</p>
            <select
              value={childAge}
              onChange={e => setChildAge(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
            >
              <option value="">Select age range (optional)</option>
              {AGE_EXPECTATIONS.map(ae => (
                <option key={ae.age} value={ae.age}>
                  {ae.age} years — {ae.yearGroup}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Sit with your child. Takes about 3-5 minutes.
          </p>

          <button
            onClick={() => setStage('screening')}
            className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200"
          >
            Start Assessment
          </button>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREENING PAGE — "Which of these can your child read?"
  // ═══════════════════════════════════════════════════════════
  if (stage === 'screening') {
    const handleScreeningContinue = () => {
      const start = calculateStartLevel(screeningChecks);
      setStartLevel(start);
      setCurrentLevel(start);
      setCurrentCategoryIdx(0);
      setCurrentTranche(1);
      setCurrentItemIdx(0);
      setCompletedCategories([]);
      setStage('testing');
    };

    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
          <h2 className="text-xl font-extrabold text-foreground mb-2 tracking-tight">
            Quick Check
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Which of these words can your child read aloud?<br />
            Tap the speaker to hear each word, then tick the ones they know.
          </p>

          <div className="space-y-3 mb-6">
            {SCREENING_WORDS.map(({ level, word }) => (
              <div
                key={level}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  screeningChecks[level]
                    ? `${LEVEL_BORDERS[level]} bg-green-50 dark:bg-green-950/20`
                    : 'border-border bg-card'
                }`}
                onClick={() => setScreeningChecks(prev => ({ ...prev, [level]: !prev[level] }))}
              >
                {/* Checkbox */}
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  screeningChecks[level]
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300'
                }`}>
                  {screeningChecks[level] && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>

                {/* Word */}
                <span className="font-child text-2xl font-bold text-foreground flex-1 text-left">
                  {word}
                </span>

                {/* Speaker */}
                <div onClick={e => e.stopPropagation()}>
                  <WordPlayer word={word} size="md" />
                </div>

                {/* Level badge */}
                <span className={`${LEVEL_COLORS[level]} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0`}>
                  L{level}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleScreeningContinue}
            className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setScreeningChecks({});
              handleScreeningContinue();
            }}
            className="w-full mt-3 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-sm active:scale-[0.97] transition-transform duration-200"
          >
            Skip — start from Level 1
          </button>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TESTING SCREEN (adaptive, tranche-based)
  // ═══════════════════════════════════════════════════════════
  if (stage === 'testing') {
    // Fluency — special case (L4+ only, after all other categories)
    if (currentCategoryIdx >= categories.length) {
      if (currentLevel >= 4) {
        return (
          <Layout>
            <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
              <div className="flex justify-between items-center mb-4">
                <span className={`text-xs font-bold uppercase tracking-wide ${LEVEL_TEXT[currentLevel]}`}>
                  Level {currentLevel}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Fluency Test
                </span>
              </div>

              <div className="bg-card border border-border rounded-2xl p-8 mb-6 shadow-card">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-foreground font-bold mb-2">Timed Reading — 1 Minute</p>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  Use a Level {currentLevel} book passage. Time your child for 1 minute.
                  Count the words read correctly.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    value={fluencyWpm}
                    onChange={e => setFluencyWpm(e.target.value)}
                    placeholder="0"
                    className="w-24 text-center text-3xl font-bold p-3 rounded-xl border-2 border-border focus:border-primary outline-none bg-background"
                    min={0} max={300}
                  />
                  <span className="text-sm font-bold text-muted-foreground">wpm</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const passed = completedCategories.every(c => c.passed);
                  finishLevel(completedCategories, passed);
                }}
                className={`w-full py-4 rounded-xl ${LEVEL_COLORS[currentLevel]} text-white font-bold text-base shadow-sm active:scale-[0.97] transition-transform duration-200`}
              >
                Submit & Finish Level {currentLevel}
              </button>
            </div>
          </Layout>
        );
      }
      // L1-L3: no fluency, finish level
      const passed = completedCategories.every(c => c.passed);
      finishLevel(completedCategories, passed);
      return null;
    }

    if (!currentCategory || !currentItem) return null;

    const isSoundRound = currentCategory === 'sound_recognition';
    const allCategoryItems = getItems(currentLevel, currentCategory);
    const small = isSmallCategory(currentLevel, currentCategory);

    // Progress: completed categories + current progress
    const completedItemCount = completedCategories.length * 3; // rough estimate
    const progressPercent = Math.min(95, ((completedCategories.length + 0.5) / categories.length) * 100);

    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-bold uppercase tracking-wide ${LEVEL_TEXT[currentLevel]}`}>
              Level {currentLevel}
            </span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABELS[currentCategory]}
            </span>
          </div>

          {/* Level progress bar */}
          <div className="h-1.5 rounded-full bg-muted mb-1 overflow-hidden">
            <div
              className={`h-full ${LEVEL_COLORS[currentLevel]} rounded-full transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mb-4">
            {completedCategories.length}/{categories.length} sections · Item {cumulativeTotal + 1}
            {!small && currentTranche <= 2 && (
              <span className="ml-1 text-blue-500">
                <Zap className="w-2.5 h-2.5 inline" /> adaptive
              </span>
            )}
          </p>

          {/* Instruction */}
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {CATEGORY_INSTRUCTIONS[currentCategory]}
          </p>

          {/* Item card */}
          <div className={`bg-card border-2 ${LEVEL_BORDERS[currentLevel]} rounded-2xl p-10 mb-6 shadow-card`}>
            <p className="font-child text-5xl font-bold text-foreground">
              {currentItem.item}
            </p>
            {isSoundRound && (
              <div className="mt-6 flex justify-center">
                <PhonemePlayer grapheme={getSoundKey(currentItem.item)} size="lg" />
              </div>
            )}
            {!isSoundRound && (
              <div className="mt-6 flex justify-center">
                <WordPlayer word={currentItem.item} size="lg" />
              </div>
            )}
            {currentCategory === 'alien_words' && (
              <p className="mt-3 text-xs text-muted-foreground italic">(made-up word)</p>
            )}
          </div>

          {/* Mark buttons */}
          <p className="text-xs text-muted-foreground mb-3">Did they get it right?</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleMark(false)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-tint-orange border border-border text-foreground font-bold text-base active:scale-95 transition-transform duration-200"
            >
              <XCircle className="w-5 h-5 text-destructive" /> Not yet
            </button>
            <button
              onClick={() => handleMark(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-tint-green border border-border text-foreground font-bold text-base active:scale-95 transition-transform duration-200"
            >
              <CheckCircle2 className="w-5 h-5 text-level-3" /> Correct
            </button>
          </div>

          {/* Consecutive wrong warning */}
          {consecutiveWrong >= 2 && (
            <p className="text-xs text-orange-500 mt-3 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {consecutiveWrong} wrong in a row — 1 more skips to next section
            </p>
          )}
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LEVEL PASSED — quick celebration, auto-advance
  // ═══════════════════════════════════════════════════════════
  if (stage === 'level-passed') {
    return (
      <Layout>
        <div className="px-4 pt-12 pb-4 max-w-md mx-auto text-center">
          <div className={`${LEVEL_COLORS[currentLevel]} text-white rounded-2xl p-8 mb-6 shadow-card`}>
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-90" />
            <p className="text-3xl font-extrabold mb-1">Level {currentLevel} Passed!</p>
            <p className="text-sm opacity-80">{LEVEL_NAMES[currentLevel].name}</p>
          </div>

          <button
            onClick={advanceToNextLevel}
            className={`w-full py-4 rounded-xl ${LEVEL_COLORS[Math.min(currentLevel + 1, 6)]} text-white font-bold text-base shadow-sm active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2`}
          >
            Continue to Level {currentLevel + 1} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LEVEL RESULTS — shown when a level is FAILED (assessment stops)
  // ═══════════════════════════════════════════════════════════
  if (stage === 'level-results') {
    const score = levelScores[levelScores.length - 1];
    if (!score) return null;

    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
          <div className={`${LEVEL_COLORS[score.level]} text-white rounded-2xl p-5 mb-5 shadow-card`}>
            <p className="text-sm opacity-80">Level {score.level} — {LEVEL_NAMES[score.level].name}</p>
            <p className="text-3xl font-extrabold mt-1 mb-1">Not Yet</p>
            <p className="text-xs opacity-70">This is your child's current working level</p>
          </div>

          {/* Category breakdown */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-card">
            <p className="text-xs font-bold text-foreground mb-3">Score Breakdown</p>
            <div className="space-y-2.5">
              {score.categories.map(cat => {
                const threshold = getCategoryThreshold(score.level, cat.category);
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-muted-foreground">{CATEGORY_LABELS[cat.category]}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-bold">{cat.correct}/{cat.total}</span>
                        <span className={`font-bold ${cat.passed ? 'text-level-3' : 'text-destructive'}`}>
                          ({cat.percentage}%)
                        </span>
                        {cat.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-level-3" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-destructive" />
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cat.passed ? 'bg-level-3' : 'bg-destructive'}`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Need {threshold}% to pass</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wrong items */}
          {(() => {
            const wrongItems = answers.filter(a => a.level === score.level && !a.isCorrect);
            if (wrongItems.length === 0) return null;
            return (
              <div className="bg-tint-orange rounded-2xl p-4 mb-5 text-left">
                <p className="text-xs font-bold text-foreground mb-2">Items to practise</p>
                <div className="flex flex-wrap gap-1.5">
                  {wrongItems.map((w, i) => (
                    <span key={i} className="text-xs bg-background border border-border rounded-lg px-2 py-1 font-mono">
                      {w.item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          <button
            onClick={() => setStage('final-results')}
            className="w-full py-4 rounded-xl gradient-primary text-white font-bold text-base shadow-sm active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
          >
            See Full Results <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FINAL RESULTS — Sound Map + recommended level + age comparison
  // ═══════════════════════════════════════════════════════════
  if (stage === 'final-results') {
    const recommendedLevel = getRecommendedLevel();
    const levelInfo = LEVELS.find(l => l.level === recommendedLevel);
    const ageComparison = getAgeComparison();
    const soundMap = buildSoundMap(answers, levelScores, startLevel);

    return (
      <Layout>
        <div className="px-4 pt-6 pb-8 max-w-md mx-auto text-center">
          <h2 className="text-[28px] font-extrabold text-foreground mb-1 tracking-tight">
            Assessment Complete
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Here's your child's phonics profile.
          </p>

          {/* Recommended level */}
          <div className={`${LEVEL_COLORS[recommendedLevel]} text-white rounded-2xl p-6 mb-5 shadow-card`}>
            <Star className="w-8 h-8 mx-auto mb-2 opacity-90" />
            <p className="text-sm opacity-80 mb-1">Recommended starting level</p>
            <p className="text-4xl font-extrabold mb-1">Level {recommendedLevel}</p>
            {levelInfo && (
              <>
                <p className="text-sm font-bold">{levelInfo.name}</p>
                <p className="text-xs opacity-80 mt-1">{levelInfo.ageRange}</p>
              </>
            )}
          </div>

          {/* Age comparison */}
          {ageComparison && (
            <div className="bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-card">
              <p className="text-xs font-bold text-foreground mb-2">
                UK Age Comparison — {ageComparison.age} years ({ageComparison.yearGroup})
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Expected level</span>
                  <span className="font-bold">{ageComparison.expectedLevel}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Your child</span>
                  <span className="font-bold">Level {recommendedLevel}</span>
                </div>
                {(() => {
                  const expectedMatch = ageComparison.expectedLevel.match(/\d+/g);
                  if (!expectedMatch) return null;
                  const expectedHigh = parseInt(expectedMatch[expectedMatch.length - 1]);
                  const expectedLow = parseInt(expectedMatch[0]);

                  let status: 'above' | 'at' | 'below';
                  if (recommendedLevel > expectedHigh) status = 'above';
                  else if (recommendedLevel >= expectedLow) status = 'at';
                  else status = 'below';

                  const cfg = {
                    above: { label: 'Above expectations', color: 'text-level-3', bg: 'bg-tint-green' },
                    at: { label: 'At expected level', color: 'text-level-4', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                    below: { label: 'Below expectations', color: 'text-orange-500', bg: 'bg-tint-orange' },
                  }[status];

                  return (
                    <div className={`${cfg.bg} rounded-lg p-3 mt-2`}>
                      <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                      {status === 'below' && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          In England, children this age typically work at {ageComparison.expectedLevel}.
                          Targeted practice with MyPhonicsBooks can help close this gap.
                        </p>
                      )}
                      {status === 'above' && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Your child is ahead of UK age expectations. Keep up the great work!
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Sound Map */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-card">
            <p className="text-xs font-bold text-foreground mb-3">Sound Map</p>
            <SoundMap sounds={soundMap} />
          </div>

          {/* Level-by-level breakdown */}
          {levelScores.length > 0 && (
            <div className="space-y-3 mb-5">
              <p className="text-xs font-bold text-foreground text-left">Level Results</p>
              {levelScores.map(score => (
                <div key={score.level} className="bg-card border border-border rounded-2xl p-4 text-left shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-full ${LEVEL_COLORS[score.level]} text-white text-xs font-bold flex items-center justify-center`}>
                        {score.level}
                      </span>
                      <span className="text-sm font-bold text-foreground">{LEVEL_NAMES[score.level].name}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      score.passed ? 'bg-tint-green text-level-3' : 'bg-tint-orange text-orange-500'
                    }`}>
                      {score.passed ? 'PASSED' : 'NOT YET'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {score.categories.map(cat => (
                      <div key={cat.category} className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">{CATEGORY_LABELS[cat.category]}</span>
                        <span className={`font-bold ${cat.passed ? 'text-foreground' : 'text-orange-500'}`}>
                          {cat.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All wrong items */}
          {(() => {
            const allWrong = answers.filter(a => !a.isCorrect);
            if (allWrong.length === 0) return null;
            return (
              <div className="bg-tint-orange rounded-2xl p-4 mb-5 text-left">
                <p className="text-xs font-bold text-foreground mb-2">
                  All items to practise ({allWrong.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allWrong.map((w, i) => (
                    <span key={i} className="text-xs bg-background border border-border rounded-lg px-2 py-1 font-mono">
                      {w.item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border font-bold text-sm shadow-card active:scale-[0.97] transition-transform duration-200"
            >
              <RotateCcw className="w-4 h-4" /> Retake
            </button>
            <button
              onClick={() => navigate('/', { state: { filterLevel: recommendedLevel } })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ${LEVEL_COLORS[recommendedLevel]} text-white font-bold text-sm shadow-sm active:scale-[0.97] transition-transform duration-200`}
            >
              Browse Level {recommendedLevel} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
