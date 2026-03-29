import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { PhonemePlayer } from '@/components/PhonemePlayer';
import { WordPlayer } from '@/components/WordPlayer';
import { SoundMap } from '@/components/SoundMap';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/useBooks';
import { LEVELS } from '@/lib/types';
import {
  AGE_EXPECTATIONS,
  LEVEL_NAMES,
  CATEGORY_LABELS,
  CATEGORY_INSTRUCTIONS,
  getItems,
  type Category,
} from '@/lib/assessmentData';
import {
  SCREENING_WORDS,
  calculateStartLevel,
  buildSoundMap,
  buildResultsMap,
  type Answer,
  type LevelScore,
  type CategoryResult,
} from '@/lib/adaptiveEngine';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, ArrowRight, Trophy, AlertTriangle, Star, Zap, Search, Baby, School, Languages, BookOpen, Heart, Lightbulb, Clock, MessageCircle, Sparkles } from 'lucide-react';

// ─── Onboarding ──────────────────────────────────────────────

interface ChildProfile {
  birthMonth: number;   // 1-12
  birthYear: number;    // e.g. 2020
  schoolType: string;
  learningNeeds: string;
  homeLanguage: string;
  readingHabits: string;
}

const SCHOOL_TYPES = [
  'Public school',
  'Private school',
  'International school',
  'Religious school',
  'Homeschool',
  'Not yet in school',
];

const LEARNING_NEEDS = [
  'None',
  'Dyslexia',
  'Speech & language',
  'English as additional language',
  'ADHD / focus',
  'Other',
];

const HOME_LANGUAGES = [
  'English only',
  'English + another language',
  'Mostly another language',
];

const READING_HABITS = [
  'Reads every day',
  'A few times a week',
  'Occasionally',
  'Just getting started',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getAgeFromDob(month: number, year: number): number {
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month) age--;
  return age;
}

function getAgeRangeFromDob(month: number, year: number): string | null {
  const now = new Date();
  const ageMonths = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  const ageYears = ageMonths / 12;

  if (ageYears < 4) return null;
  if (ageYears < 4.5) return '4–4.5';
  if (ageYears < 5) return '4.5–5';
  if (ageYears < 5.5) return '5–5.5';
  if (ageYears < 6) return '5.5–6';
  if (ageYears < 7) return '6–7';
  return '7–8';
}

interface PersonalisedTip {
  icon: 'clock' | 'lightbulb' | 'message' | 'sparkles' | 'heart' | 'book';
  title: string;
  body: string;
}

function getPersonalisedTips(profile: ChildProfile, recommendedLevel: number, ageComparison: { age: string; expectedLevel: string } | null): PersonalisedTip[] {
  const tips: PersonalisedTip[] = [];

  // Reading time recommendation based on age and habits
  const age = profile.birthYear ? getAgeFromDob(profile.birthMonth, profile.birthYear) : 5;
  const dailyMinutes = age <= 5 ? 10 : age <= 6 ? 15 : 20;

  if (profile.readingHabits === 'Occasionally' || profile.readingHabits === 'Just getting started') {
    tips.push({
      icon: 'clock',
      title: `Start with just ${dailyMinutes} minutes a day`,
      body: `At age ${age}, even ${dailyMinutes} minutes of daily reading practice makes a huge difference. Try reading together at the same time each day — bedtime or after school works well. Consistency matters more than length.`,
    });
  } else if (profile.readingHabits === 'A few times a week') {
    tips.push({
      icon: 'clock',
      title: `Try to read every day — aim for ${dailyMinutes} minutes`,
      body: `You're already reading regularly, which is brilliant. Making it a daily habit — even for ${dailyMinutes} minutes — will accelerate your child's progress noticeably. Little and often is the key.`,
    });
  } else {
    tips.push({
      icon: 'sparkles',
      title: 'You\'re doing brilliantly',
      body: `Daily reading at age ${age} is one of the best things you can do. Keep it up — ${dailyMinutes} minutes a day is perfect. Your child is building strong reading foundations.`,
    });
  }

  // EAL / bilingual advice
  if (profile.homeLanguage === 'English + another language') {
    tips.push({
      icon: 'message',
      title: 'Bilingualism is a superpower',
      body: 'Speaking two languages at home is a huge advantage for your child\'s brain development. Keep speaking both languages — it doesn\'t slow down English reading. Read phonics books in English, but story books in either language.',
    });
  } else if (profile.homeLanguage === 'Mostly another language') {
    tips.push({
      icon: 'message',
      title: 'Extra English reading time will help',
      body: 'Since English isn\'t the main language at home, your child may need a little more daily phonics practice to build fluency. Try to fit in 10–15 minutes of English reading alongside your home language — both are valuable.',
    });
  }

  // Learning needs specific tips
  if (profile.learningNeeds === 'Dyslexia') {
    tips.push({
      icon: 'heart',
      title: 'Multi-sensory reading works best',
      body: 'For children with dyslexia, phonics is especially important — and so is patience. Use the sound buttons, trace letters with fingers, and keep sessions short (5–10 minutes). Celebrate every small win. Progress may be slower but it\'s very real.',
    });
  } else if (profile.learningNeeds === 'Speech & language') {
    tips.push({
      icon: 'heart',
      title: 'Sounds first, then blending',
      body: 'Children with speech and language needs benefit hugely from hearing sounds clearly. Use the sound buttons often, and give extra time for your child to respond. If they can hear the sound, they can learn to read it — even if speaking it is harder.',
    });
  } else if (profile.learningNeeds === 'English as additional language') {
    tips.push({
      icon: 'message',
      title: 'Phonics works brilliantly for EAL learners',
      body: 'Systematic phonics is one of the most effective approaches for children learning English as an additional language. The sounds are consistent and predictable. Pair phonics practice with picture books to build vocabulary alongside decoding.',
    });
  } else if (profile.learningNeeds === 'ADHD / focus') {
    tips.push({
      icon: 'lightbulb',
      title: 'Short bursts, big rewards',
      body: 'Keep reading sessions to 5–8 minutes — shorter sessions with full attention beat longer distracted ones. Try adding movement: stand up between pages, use a pointer to track words, or do a star jump after each page. Make it active!',
    });
  }

  // Age comparison advice
  if (ageComparison) {
    const expectedMatch = ageComparison.expectedLevel.match(/\d+/g);
    if (expectedMatch) {
      const expectedLow = parseInt(expectedMatch[0]);
      if (recommendedLevel < expectedLow) {
        tips.push({
          icon: 'lightbulb',
          title: 'Closing the gap is very achievable',
          body: `Your child is a little behind UK expectations for their age — but this is completely normal and very fixable. With ${dailyMinutes} minutes of daily phonics practice at Level ${recommendedLevel}, most children catch up within a term. The key is regular practice, not cramming.`,
        });
      }
    }
  }

  // School-specific tips
  if (profile.schoolType === 'Homeschool') {
    tips.push({
      icon: 'book',
      title: 'Structure your phonics sessions',
      body: 'As a homeschooling family, you have the advantage of one-to-one attention. Follow the levels in order — each book builds on the last. A short daily phonics session (10–15 minutes) followed by free reading works well.',
    });
  } else if (profile.schoolType === 'International school' || profile.schoolType === 'Religious school') {
    tips.push({
      icon: 'book',
      title: 'Phonics at home supports school learning',
      body: 'Your child\'s school may use a different reading approach. MyPhonicsBooks follows the UK phonics curriculum, which is systematic and evidence-based. Even 10 minutes at home will complement what they learn at school.',
    });
  } else if (profile.schoolType === 'Not yet in school') {
    tips.push({
      icon: 'sparkles',
      title: 'You\'re giving them a head start',
      body: 'Starting phonics before school is a wonderful gift. Keep it playful — no pressure, just fun with sounds. Your child will arrive at school already confident with letters and sounds, which makes a real difference.',
    });
  }

  // Cap at 3 most relevant tips
  return tips.slice(0, 3);
}

const ONBOARDING_STEPS = ['dob', 'school', 'needs', 'language', 'reading'] as const;
type OnboardingStep = typeof ONBOARDING_STEPS[number];

// ─── Types ────────────────────────────────────────────────────
type Stage =
  | 'welcome'
  | 'onboarding'
  | 'screening'
  | 'sound-test'       // Testing all sounds at a level
  | 'alien-check'      // 6 alien words at a level
  | 'word-confirm'     // 6 words from level below (after clear fail)
  | 'probe-up'         // Testing sounds at next level (after near pass)
  | 'level-passed'     // Brief celebration
  | 'final-results';

// Performance bands after testing all sounds at a level
type SoundResult = 'clear-pass' | 'near-pass' | 'medium-fail' | 'clear-fail';

const ALIEN_CHECK_COUNT = 6;
const WORD_CONFIRM_COUNT = 6;

// ─── Constants ────────────────────────────────────────────────
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
    'ow (blow)': 'ow', 'ow (cow)': 'ow_cow',
    'oo (moon)': 'oo_moon', 'oo (look)': 'oo_look',
  };
  const lower = grapheme.toLowerCase().trim();
  if (VARIANT_MAP[lower]) return VARIANT_MAP[lower];
  const base = lower.replace(/\s*\(.*\)/, '').trim();
  return base.replace(/-/g, '_');
}

function classifySoundResult(correct: number, total: number): SoundResult {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  if (pct >= 90) return 'clear-pass';
  if (pct >= 80) return 'near-pass';   // just 1-2 wrong
  if (pct >= 50) return 'medium-fail';
  return 'clear-fail';
}

// ─── Component ────────────────────────────────────────────────
export default function Assessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: children } = useChildren();

  // Core state
  const [stage, setStage] = useState<Stage>('welcome');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('dob');
  const [profile, setProfile] = useState<ChildProfile>({
    birthMonth: 0,
    birthYear: 0,
    schoolType: '',
    learningNeeds: '',
    homeLanguage: '',
    readingHabits: '',
  });
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [levelScores, setLevelScores] = useState<LevelScore[]>([]);

  // Screening
  const [screeningChecks, setScreeningChecks] = useState<Record<number, boolean>>({});
  const [startLevel, setStartLevel] = useState(1);

  // Current testing state
  const [currentLevel, setCurrentLevel] = useState(1);
  const [testItems, setTestItems] = useState<{ level: number; category: Category; item: string; targetGrapheme?: string }[]>([]);
  const [testIdx, setTestIdx] = useState(0);
  const [testCorrect, setTestCorrect] = useState(0);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);

  // Tracking
  const [soundCeiling, setSoundCeiling] = useState<number | null>(null);

  // ─── Load helpers ─────────────────────────────────────────

  const loadItems = (level: number, category: Category, count?: number) => {
    const items = getItems(level, category);
    const subset = count ? items.slice(0, count) : items;
    setTestItems(subset);
    setTestIdx(0);
    setTestCorrect(0);
    setConsecutiveWrong(0);
    setCurrentLevel(level);
  };

  const recordLevelScore = (level: number, categories: CategoryResult[], passed: boolean) => {
    setLevelScores(prev => {
      // Update existing score for this level if present
      const existing = prev.findIndex(s => s.level === level);
      const score: LevelScore = { level, categories, passed };
      if (existing >= 0) {
        const updated = [...prev];
        // Merge categories
        updated[existing] = {
          ...updated[existing],
          categories: [...updated[existing].categories, ...categories],
          passed,
        };
        return updated;
      }
      return [...prev, score];
    });
  };

  const getRecommendedLevel = (): number => {
    if (soundCeiling !== null) return soundCeiling;
    const passedLevels = levelScores.filter(s => s.passed).map(s => s.level);
    if (passedLevels.length === 0) return startLevel;
    return Math.min(Math.max(...passedLevels) + 1, 6);
  };

  const getAgeComparison = () => {
    if (!profile.birthMonth || !profile.birthYear) return null;
    const ageRange = getAgeRangeFromDob(profile.birthMonth, profile.birthYear);
    if (!ageRange) return null;
    return AGE_EXPECTATIONS.find(e => e.age === ageRange);
  };

  const reset = () => {
    setStage('welcome');
    setOnboardingStep('dob');
    setProfile({ birthMonth: 0, birthYear: 0, schoolType: '', learningNeeds: '', homeLanguage: '', readingHabits: '' });
    setAnswers([]);
    setLevelScores([]);
    setScreeningChecks({});
    setStartLevel(1);
    setCurrentLevel(1);
    setTestItems([]);
    setTestIdx(0);
    setTestCorrect(0);
    setConsecutiveWrong(0);
    setSoundCeiling(null);
  };

  // ─── Sound test completion ────────────────────────────────

  const handleSoundsComplete = useCallback((level: number, correct: number, total: number) => {
    const pct = Math.round((correct / total) * 100);
    const result = classifySoundResult(correct, total);

    const catResult: CategoryResult = {
      category: 'sound_recognition',
      correct, total, percentage: pct,
      passed: result === 'clear-pass' || result === 'near-pass',
    };

    switch (result) {
      case 'clear-pass':
        // Passed! Record and do 6 alien words to confirm, then advance
        recordLevelScore(level, [catResult], true);
        if (level >= 6) {
          setStage('final-results');
        } else {
          // Do 6 alien words then move up
          loadItems(level, 'alien_words', ALIEN_CHECK_COUNT);
          setStage('alien-check');
        }
        break;

      case 'near-pass':
        // Nearly there — do 6 alien words, then probe next level
        recordLevelScore(level, [catResult], true);
        loadItems(level, 'alien_words', ALIEN_CHECK_COUNT);
        setStage('alien-check');
        break;

      case 'medium-fail':
        // This is their working level — stop
        setSoundCeiling(level);
        recordLevelScore(level, [catResult], false);
        loadItems(level, 'alien_words', ALIEN_CHECK_COUNT);
        setStage('alien-check');
        break;

      case 'clear-fail':
        // Well below — drop down, test words from level before to confirm
        setSoundCeiling(level);
        recordLevelScore(level, [catResult], false);
        if (level > 1) {
          loadItems(level - 1, 'word_reading', WORD_CONFIRM_COUNT);
          setStage('word-confirm');
        } else {
          // Already at L1 — just go to results
          setStage('final-results');
        }
        break;
    }
  }, []);

  // ─── Alien words completion ───────────────────────────────

  const handleAliensComplete = useCallback((level: number, correct: number, total: number) => {
    const pct = Math.round((correct / total) * 100);
    const catResult: CategoryResult = {
      category: 'alien_words',
      correct, total, percentage: pct,
      passed: pct >= 75,
    };
    recordLevelScore(level, [catResult], levelScores.find(s => s.level === level)?.passed ?? false);

    // If this level was a ceiling (medium fail), go to results
    if (soundCeiling !== null) {
      setStage('final-results');
      return;
    }

    // Otherwise this level passed — show celebration and advance
    if (level >= 6) {
      setStage('final-results');
    } else {
      setStage('level-passed');
    }
  }, [soundCeiling, levelScores]);

  // ─── Word confirm completion (after clear fail, testing level below) ─

  const handleWordConfirmComplete = useCallback((level: number, correct: number, total: number) => {
    const pct = Math.round((correct / total) * 100);
    const catResult: CategoryResult = {
      category: 'word_reading',
      correct, total, percentage: pct,
      passed: pct >= 85,
    };
    recordLevelScore(level, [catResult], pct >= 85);
    setStage('final-results');
  }, []);

  // ─── Generic mark handler ─────────────────────────────────

  const handleMark = useCallback((correct: boolean) => {
    const item = testItems[testIdx];
    if (!item) return;

    // Record answer
    setAnswers(prev => [...prev, {
      level: item.level,
      category: item.category,
      item: item.item,
      isCorrect: correct,
    }]);

    const newCorrect = testCorrect + (correct ? 1 : 0);
    setTestCorrect(newCorrect);

    const newConsecWrong = correct ? 0 : consecutiveWrong + 1;
    setConsecutiveWrong(newConsecWrong);

    const newTotal = testIdx + 1;
    const remaining = testItems.length - newTotal;

    // 3 consecutive wrong on sounds → early stop
    if (stage === 'sound-test' && newConsecWrong >= 3 && newTotal >= 6) {
      handleSoundsComplete(currentLevel, newCorrect, newTotal);
      return;
    }

    // Check if we've finished all items
    if (testIdx >= testItems.length - 1) {
      // Finished — route to appropriate handler
      if (stage === 'sound-test') {
        handleSoundsComplete(currentLevel, newCorrect, newTotal);
      } else if (stage === 'alien-check') {
        handleAliensComplete(currentLevel, newCorrect, newTotal);
      } else if (stage === 'word-confirm') {
        handleWordConfirmComplete(currentLevel, newCorrect, newTotal);
      } else if (stage === 'probe-up') {
        // Probe results: if they did well, update ceiling
        const pct = Math.round((newCorrect / newTotal) * 100);
        if (pct >= 80) {
          // They can handle the next level too
          setSoundCeiling(currentLevel + 1 <= 6 ? currentLevel + 1 : null);
          recordLevelScore(currentLevel, [{
            category: 'sound_recognition',
            correct: newCorrect, total: newTotal,
            percentage: pct, passed: true,
          }], true);
        }
        setStage('final-results');
      }
      return;
    }

    setTestIdx(testIdx + 1);
  }, [testItems, testIdx, testCorrect, consecutiveWrong, stage, currentLevel,
      handleSoundsComplete, handleAliensComplete, handleWordConfirmComplete]);

  // ─── Advance to next level ────────────────────────────────

  const advanceToNextLevel = () => {
    const nextLevel = currentLevel + 1;
    loadItems(nextLevel, 'sound_recognition');
    setStage('sound-test');
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
            Find your child's reading level in about 4 minutes.
          </p>

          <div className="bg-tint-pink rounded-2xl p-5 mb-6 text-left">
            <p className="text-sm font-bold text-foreground mb-3">How it works</p>
            <div className="space-y-2.5">
              {[
                { icon: '1', label: 'A few quick questions', desc: 'Tell us about your child' },
                { icon: '2', label: 'Quick check', desc: 'Tick which words your child can read' },
                { icon: '3', label: 'Sound test', desc: 'We test every sound at their level' },
                { icon: '4', label: 'Results', desc: 'See which sounds they know and need to learn' },
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

          <p className="text-xs text-muted-foreground mb-6">
            Sit with your child. Takes about 4 minutes.
          </p>

          <button
            onClick={() => { setOnboardingStep('dob'); setStage('onboarding'); }}
            className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200"
          >
            Get Started
          </button>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ONBOARDING — quick-tap profiling
  // ═══════════════════════════════════════════════════════════
  if (stage === 'onboarding') {
    const stepIdx = ONBOARDING_STEPS.indexOf(onboardingStep);
    const totalSteps = ONBOARDING_STEPS.length;
    const progressPct = ((stepIdx) / totalSteps) * 100;

    const goNext = () => {
      if (stepIdx < totalSteps - 1) {
        setOnboardingStep(ONBOARDING_STEPS[stepIdx + 1]);
      } else {
        setStage('screening');
      }
    };

    const goBack = () => {
      if (stepIdx > 0) {
        setOnboardingStep(ONBOARDING_STEPS[stepIdx - 1]);
      } else {
        setStage('welcome');
      }
    };

    const selectOption = (field: keyof ChildProfile, value: string) => {
      setProfile(prev => ({ ...prev, [field]: value }));
      // Auto-advance after a short delay for non-DOB steps
      setTimeout(goNext, 200);
    };

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 3 - i); // ages ~3-12

    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-1">
            <button onClick={goBack} className="text-xs text-muted-foreground hover:text-foreground">
              ← Back
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setStage('screening')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
          </div>
          <div className="h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
            <div
              className="h-full bg-level-1 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* ─── DOB Step ─── */}
          {onboardingStep === 'dob' && (
            <div className="text-center">
              <Baby className="w-10 h-10 mx-auto mb-3 text-level-1" />
              <h3 className="text-xl font-extrabold text-foreground mb-1">
                When was your child born?
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                This helps us compare to UK age expectations.
              </p>

              <div className="flex gap-3 mb-6">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 text-left">Month</label>
                  <select
                    value={profile.birthMonth || ''}
                    onChange={e => setProfile(prev => ({ ...prev, birthMonth: parseInt(e.target.value) }))}
                    className="w-full p-3 rounded-xl border-2 border-border bg-card text-sm font-bold appearance-none"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 text-left">Year</label>
                  <select
                    value={profile.birthYear || ''}
                    onChange={e => setProfile(prev => ({ ...prev, birthYear: parseInt(e.target.value) }))}
                    className="w-full p-3 rounded-xl border-2 border-border bg-card text-sm font-bold appearance-none"
                  >
                    <option value="">Year</option>
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {profile.birthMonth > 0 && profile.birthYear > 0 && (
                <p className="text-xs text-muted-foreground mb-4">
                  Age: {getAgeFromDob(profile.birthMonth, profile.birthYear)} years old
                </p>
              )}

              <button
                onClick={goNext}
                disabled={!profile.birthMonth || !profile.birthYear}
                className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200 disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          )}

          {/* ─── School Type ─── */}
          {onboardingStep === 'school' && (
            <div className="text-center">
              <School className="w-10 h-10 mx-auto mb-3 text-level-2" />
              <h3 className="text-xl font-extrabold text-foreground mb-1">
                What type of school?
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                This helps us tailor recommendations.
              </p>

              <div className="space-y-2.5">
                {SCHOOL_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => selectOption('schoolType', type)}
                    className={`w-full p-4 rounded-xl border-2 text-left text-sm font-bold transition-all active:scale-[0.97] ${
                      profile.schoolType === type
                        ? 'border-level-2 bg-amber-50 dark:bg-amber-950/20 text-foreground'
                        : 'border-border bg-card text-foreground hover:border-level-2/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Learning Needs ─── */}
          {onboardingStep === 'needs' && (
            <div className="text-center">
              <Heart className="w-10 h-10 mx-auto mb-3 text-level-5" />
              <h3 className="text-xl font-extrabold text-foreground mb-1">
                Any learning needs?
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                So we can support your child's journey.
              </p>

              <div className="space-y-2.5">
                {LEARNING_NEEDS.map(need => (
                  <button
                    key={need}
                    onClick={() => selectOption('learningNeeds', need)}
                    className={`w-full p-4 rounded-xl border-2 text-left text-sm font-bold transition-all active:scale-[0.97] ${
                      profile.learningNeeds === need
                        ? 'border-level-5 bg-purple-50 dark:bg-purple-950/20 text-foreground'
                        : 'border-border bg-card text-foreground hover:border-level-5/50'
                    }`}
                  >
                    {need}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Home Language ─── */}
          {onboardingStep === 'language' && (
            <div className="text-center">
              <Languages className="w-10 h-10 mx-auto mb-3 text-level-4" />
              <h3 className="text-xl font-extrabold text-foreground mb-1">
                Language at home?
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                Helps us understand your child's reading context.
              </p>

              <div className="space-y-2.5">
                {HOME_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => selectOption('homeLanguage', lang)}
                    className={`w-full p-4 rounded-xl border-2 text-left text-sm font-bold transition-all active:scale-[0.97] ${
                      profile.homeLanguage === lang
                        ? 'border-level-4 bg-blue-50 dark:bg-blue-950/20 text-foreground'
                        : 'border-border bg-card text-foreground hover:border-level-4/50'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Reading Habits ─── */}
          {onboardingStep === 'reading' && (
            <div className="text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-level-3" />
              <h3 className="text-xl font-extrabold text-foreground mb-1">
                How often do you read together?
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                No judgement — just helps us personalise.
              </p>

              <div className="space-y-2.5">
                {READING_HABITS.map(habit => (
                  <button
                    key={habit}
                    onClick={() => selectOption('readingHabits', habit)}
                    className={`w-full p-4 rounded-xl border-2 text-left text-sm font-bold transition-all active:scale-[0.97] ${
                      profile.readingHabits === habit
                        ? 'border-level-3 bg-green-50 dark:bg-green-950/20 text-foreground'
                        : 'border-border bg-card text-foreground hover:border-level-3/50'
                    }`}
                  >
                    {habit}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SCREENING
  // ═══════════════════════════════════════════════════════════
  if (stage === 'screening') {
    const handleScreeningContinue = () => {
      const start = calculateStartLevel(screeningChecks);
      setStartLevel(start);
      loadItems(start, 'sound_recognition');
      setStage('sound-test');
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
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  screeningChecks[level] ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}>
                  {screeningChecks[level] && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className="font-child text-2xl font-bold text-foreground flex-1 text-left">{word}</span>
                <div onClick={e => e.stopPropagation()}>
                  <WordPlayer word={word} size="md" />
                </div>
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
              setStartLevel(1);
              loadItems(1, 'sound_recognition');
              setStage('sound-test');
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
  // TESTING SCREEN (sounds, aliens, words, probe — all use same UI)
  // ═══════════════════════════════════════════════════════════
  if (stage === 'sound-test' || stage === 'alien-check' || stage === 'word-confirm' || stage === 'probe-up') {
    const currentItem = testItems[testIdx];
    if (!currentItem) return null;

    const isSoundRound = currentItem.category === 'sound_recognition';
    const isAlienRound = currentItem.category === 'alien_words';

    const stageLabel = {
      'sound-test': 'Sounds',
      'alien-check': 'Alien Words',
      'word-confirm': 'Word Check',
      'probe-up': 'Bonus Round',
    }[stage];

    const stageInstruction = {
      'sound-test': CATEGORY_INSTRUCTIONS.sound_recognition,
      'alien-check': CATEGORY_INSTRUCTIONS.alien_words,
      'word-confirm': CATEGORY_INSTRUCTIONS.word_reading,
      'probe-up': CATEGORY_INSTRUCTIONS.sound_recognition,
    }[stage];

    const progressPct = ((testIdx) / testItems.length) * 100;

    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-bold uppercase tracking-wide ${LEVEL_TEXT[currentLevel]}`}>
              Level {currentLevel}
            </span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {stageLabel}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted mb-1 overflow-hidden">
            <div
              className={`h-full ${LEVEL_COLORS[currentLevel]} rounded-full transition-all duration-300`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mb-4">
            {testIdx + 1} of {testItems.length}
            {stage === 'probe-up' && (
              <span className="ml-1 text-blue-500">
                <Zap className="w-2.5 h-2.5 inline" /> bonus
              </span>
            )}
          </p>

          {/* Instruction */}
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {stageInstruction}
          </p>

          {/* Item card */}
          <div className={`bg-card border-2 ${LEVEL_BORDERS[currentLevel]} rounded-2xl p-10 mb-6 shadow-card`}>
            <p className="font-child text-5xl font-bold text-foreground">
              {currentItem.item}
            </p>
            <div className="mt-6 flex justify-center">
              {isSoundRound ? (
                <PhonemePlayer grapheme={getSoundKey(currentItem.item)} size="lg" />
              ) : (
                <WordPlayer word={currentItem.item} size="lg" />
              )}
            </div>
            {isAlienRound && (
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
          {stage === 'sound-test' && consecutiveWrong >= 2 && (
            <p className="text-xs text-orange-500 mt-3 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {consecutiveWrong} wrong in a row — 1 more skips ahead
            </p>
          )}
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LEVEL PASSED — quick celebration
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
  // FINAL RESULTS
  // ═══════════════════════════════════════════════════════════
  if (stage === 'final-results') {
    const recommendedLevel = getRecommendedLevel();
    const levelInfo = LEVELS.find(l => l.level === recommendedLevel);
    const ageComparison = getAgeComparison();
    const soundMap = buildSoundMap(answers, levelScores, startLevel);
    const resultsMap = buildResultsMap(answers, levelScores);

    const testedCount = answers.length;
    const wrongItems = answers.filter(a => !a.isCorrect);

    return (
      <Layout>
        <div className="px-4 pt-6 pb-8 max-w-md mx-auto text-center">
          <h2 className="text-[28px] font-extrabold text-foreground mb-1 tracking-tight">
            Assessment Complete
          </h2>
          <p className="text-sm text-muted-foreground mb-1">
            Here's your child's phonics profile.
          </p>
          <p className="text-[10px] text-muted-foreground mb-5">
            {testedCount} items tested
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

          {/* Results Map */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-card">
            <p className="text-xs font-bold text-foreground mb-3">Results Map</p>
            <SoundMap sounds={soundMap} results={resultsMap} />
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
          {wrongItems.length > 0 && (
            <div className="bg-tint-orange rounded-2xl p-4 mb-5 text-left">
              <p className="text-xs font-bold text-foreground mb-2">
                All items to practise ({wrongItems.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {wrongItems.map((w, i) => (
                  <span key={i} className="text-xs bg-background border border-border rounded-lg px-2 py-1 font-mono">
                    {w.item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Personalised tips */}
          {(() => {
            const tips = getPersonalisedTips(profile, recommendedLevel, ageComparison ?? null);
            if (tips.length === 0) return null;

            const iconMap = {
              clock: <Clock className="w-5 h-5 text-level-4 shrink-0 mt-0.5" />,
              lightbulb: <Lightbulb className="w-5 h-5 text-level-2 shrink-0 mt-0.5" />,
              message: <MessageCircle className="w-5 h-5 text-level-5 shrink-0 mt-0.5" />,
              sparkles: <Sparkles className="w-5 h-5 text-level-3 shrink-0 mt-0.5" />,
              heart: <Heart className="w-5 h-5 text-level-1 shrink-0 mt-0.5" />,
              book: <BookOpen className="w-5 h-5 text-level-6 shrink-0 mt-0.5" />,
            };

            return (
              <div className="bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-card">
                <p className="text-xs font-bold text-foreground mb-3">Personalised for you</p>
                <div className="space-y-4">
                  {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {iconMap[tip.icon]}
                      <div>
                        <p className="text-xs font-bold text-foreground mb-0.5">{tip.title}</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{tip.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Detailed test option */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-card">
            <div className="flex items-start gap-3">
              <Search className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-foreground mb-1">Want a deeper analysis?</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  This rapid test finds your child's level. Take the full detailed test
                  to find every gap across all sounds, words, and tricky words.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mb-3">
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
