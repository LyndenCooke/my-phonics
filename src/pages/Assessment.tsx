import { useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import FunnelLayout from '@/components/funnels/FunnelLayout';
import { PhonemePlayer } from '@/components/PhonemePlayer';
import { WordPlayer } from '@/components/WordPlayer';
import { SoundMap } from '@/components/SoundMap';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import PhonicsAveragesChart from '@/components/PhonicsAveragesChart';
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
import BookUnlockedModal from '@/components/BookUnlockedModal';
import { BOOK_CATALOG } from '@/lib/bookCatalog';

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

/** Rapid = adaptive sound-led path that short-circuits once a level is
 *  passed (~3-4 min). Full = always runs alien-check AND word-confirm at
 *  every reached level so the result screen has data for every category. */
type AssessmentMode = 'rapid' | 'full';

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
interface AssessmentProps {
  /** When set, skip the welcome chooser and start with this mode pre-selected. */
  initialMode?: AssessmentMode;
  /** When true, replace the guest email capture at final-results with a single
   *  Continue button so a parent funnel can take over the post-result flow. */
  funnelMode?: boolean;
  /** Called when the user clicks Continue at the funnel-mode result screen. */
  onFunnelComplete?: (recommendedLevel: number, summary: { sounds_correct: number; sounds_asked: number; words_correct: number; words_asked: number; }) => void;
}

export default function Assessment({ initialMode, funnelMode, onFunnelComplete }: AssessmentProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: children } = useChildren();
  const [searchParams] = useSearchParams();

  // Level Check mode: when launched from the child dashboard with
  // ?level=N, we test only level N's content and update the child's
  // current_level on pass. lockedLevel == null means a normal full
  // adaptive assessment.
  const lockedLevelParam = searchParams.get('level');
  const lockedLevel = lockedLevelParam && /^[1-6]$/.test(lockedLevelParam)
    ? Number(lockedLevelParam)
    : null;

  // Core state. NOTE: `mode` is captured for the result screen and future
  // full-mode behaviour (extra word_reading + tricky_words rounds). Today
  // both modes share the adaptive path; the difference is which categories
  // are tested vs labelled "Not tested" on the result.
  const [mode, setMode] = useState<AssessmentMode>(initialMode ?? 'rapid');
  // When the funnel pre-selects a mode we skip the welcome chooser and jump
  // straight into onboarding — the chooser already lives in the funnel page.
  const [stage, setStage] = useState<Stage>(initialMode ? 'onboarding' : 'welcome');
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

  // Funnel-mode chrome: when this assessment is rendered inside the
  // /assessment funnel we strip the global app shell (top nav + bottom
  // tab bar) so visitors stay focused on completing the test rather
  // than wandering off into Library / Pricing / Profile mid-funnel.
  const Wrap = ({ children }: { children: ReactNode }) =>
    funnelMode ? <FunnelLayout>{children}</FunnelLayout> : <Layout>{children}</Layout>;

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

  // Guest email capture (for unauthenticated users at results screen)
  const [guestEmail, setGuestEmail] = useState('');
  const [guestChildName, setGuestChildName] = useState('');
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestSubmitted, setGuestSubmitted] = useState(false);

  // In funnelMode the book reveal popup opens immediately on the results
  // screen as the celebration moment. The actual breakdown sits behind it
  // dimmed, and is revealed when the parent clicks Continue on the modal.
  const [bookRevealDismissed, setBookRevealDismissed] = useState(false);

  const submitGuestAssessment = async (recommendedLevel: number) => {
    if (!guestEmail || !guestEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setGuestSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-assessment-signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: guestEmail,
            child_name: guestChildName,
            recommended_level: recommendedLevel,
            highest_level_passed: Math.max(1, recommendedLevel - 1),
            answers_summary: {
              sounds_correct: answers.filter(a => a.category === 'sound_recognition' && a.isCorrect).length,
              sounds_asked: answers.filter(a => a.category === 'sound_recognition').length,
              words_correct: answers.filter(a => a.category === 'word_reading' && a.isCorrect).length,
              words_asked: answers.filter(a => a.category === 'word_reading').length,
            },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      setGuestSubmitted(true);
    } catch (err) {
      alert((err as Error).message || 'Something went wrong');
    } finally {
      setGuestSubmitting(false);
    }
  };

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

  /** Compute the child's age in months at the moment of test, from the
   *  birthMonth + birthYear captured during onboarding. Returns null if
   *  the parent skipped DOB. */
  const getAgeMonths = (): number | null => {
    if (!profile.birthMonth || !profile.birthYear) return null;
    const now = new Date();
    const months = (now.getFullYear() - profile.birthYear) * 12 + (now.getMonth() + 1 - profile.birthMonth);
    if (months < 0 || months > 240) return null;
    return months;
  };

  // ─── Level Check mode: jump straight to the locked level's sound test
  // ────────────────────────────────────────────────────────────────────
  // Triggered when the child dashboard navigates to /assess?level=N. We
  // skip welcome / onboarding / screening and go directly to testing
  // level N. The sound-pass handler (below) checks lockedLevel to stop
  // advancing to N+1.
  const lockedJumpedRef = useRef(false);
  useEffect(() => {
    if (lockedJumpedRef.current) return;
    if (lockedLevel === null) return;
    lockedJumpedRef.current = true;
    setMode('full');                    // Test all categories for the locked level
    setStartLevel(lockedLevel);
    setCurrentLevel(lockedLevel);
    setTestItems(getItems(lockedLevel, 'sound_recognition'));
    setTestIdx(0);
    setTestCorrect(0);
    setConsecutiveWrong(0);
    setStage('sound-test');
  }, [lockedLevel]);

  // ─── Auto-save result for authenticated users ─────────────────────────
  // Guest flow already POSTs to guest-assessment-signup; for signed-in
  // users we hit save-assessment-result with the answers + age + country.
  // Only fires once per arrival at final-results. We track a ref so React
  // strict-mode double-mounts don't double-insert.
  const savedRef = useRef(false);
  useEffect(() => {
    if (stage !== 'final-results' || !user || savedRef.current) return;
    savedRef.current = true;
    (async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session?.access_token) return;
        const recommendedLevel = getRecommendedLevel();
        const ageMonths = getAgeMonths();
        // Country: best-effort — try the browser's locale region. The
        // chart uses this only for context; real country needs a UI ask.
        const countryCode =
          (typeof navigator !== 'undefined' &&
            navigator.language?.split('-')[1]?.toUpperCase()) || null;
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-assessment-result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            child_id: children?.[0]?.id ?? null,
            answers: answers.map(a => ({ item_id: a.itemId ?? null, is_correct: a.isCorrect })),
            age_months: ageMonths,
            country_code: countryCode,
            recommended_level_hint: recommendedLevel,
          }),
        });

        // Update the child's current_level so the dashboard advances. We
        // only ever raise the level — a poor retake shouldn't demote the
        // child. Best-effort; failure is silent.
        // useChildren returns raw supabase rows (snake_case)
        const childRow = children?.[0] as { id?: string; current_level?: number } | undefined;
        const childId = childRow?.id;
        const childCurrent = childRow?.current_level ?? 1;
        if (childId && recommendedLevel > childCurrent) {
          await supabase
            .from('children')
            .update({ current_level: recommendedLevel })
            .eq('id', childId);
        }
      } catch {
        // Save is best-effort — failing here doesn't block the user
        // seeing their results, and we don't want to surface noise.
      }
    })();
  }, [stage, user, children, answers]);

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
        if (level >= 6 || lockedLevel !== null) {
          // Locked-level (Level Check) mode: still run the alien check at
          // this level for completeness, but don't probe higher.
          if (lockedLevel !== null) {
            loadItems(level, 'alien_words', ALIEN_CHECK_COUNT);
            setStage('alien-check');
          } else {
            setStage('final-results');
          }
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

    // If this level was a ceiling (medium fail), or we're in Level Check
    // mode (locked to one level), stop here and go to results.
    if (soundCeiling !== null || lockedLevel !== null) {
      setStage('final-results');
      return;
    }

    // Otherwise this level passed — show celebration and advance
    if (level >= 6) {
      setStage('final-results');
    } else {
      setStage('level-passed');
    }
  }, [soundCeiling, levelScores, lockedLevel]);

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
    const STICKER_SHADOW = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';
    return (
      <Wrap>
        {/* Landscape layout: a full-width centred header, then three sibling
            cards in one row — How it works · Choose a test · What you'll get —
            so the page reads as one balanced spread instead of a tall info
            column with a short chooser column beside it. The chooser sits in
            the middle as the visual anchor. Below lg everything stacks in the
            original mobile order (info first, chooser last). */}
        <div className="px-4 pt-6 pb-8 lg:pt-12 max-w-md lg:max-w-6xl mx-auto">
          {/* ── Header — centred at every size ── */}
          <div className="text-center max-w-2xl mx-auto">
            <span
              className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-extrabold -rotate-1 text-primary-ink mb-4"
              style={{ boxShadow: STICKER_SHADOW, border: '2px solid #fff', outline: '2px solid #E84B8A30' }}
            >
              Free · no card · 3–10 minutes
            </span>
            <h2 className="font-display text-[28px] lg:text-[40px] lg:leading-[1.1] font-extrabold text-foreground mb-2 tracking-tight">
              Find your child's reading level
            </h2>
            <p className="text-sm lg:text-base text-muted-foreground leading-relaxed max-w-xs lg:max-w-md mx-auto">
              Sit together, tap through a few sounds, and we'll find the exact right books — no guessing.
            </p>
          </div>

          {/* ── Three cards, one row on lg ── */}
          <div className="mt-7 lg:mt-10 grid gap-4 lg:gap-6 lg:grid-cols-[1fr_1.15fr_1fr] lg:items-stretch">
            {/* How it works */}
            <div
              className="order-1 h-full rounded-[1.75rem] bg-white p-5 lg:p-6 text-left"
              style={{ boxShadow: STICKER_SHADOW, border: '1px solid rgba(40,30,40,0.05)' }}
            >
              <p className="text-sm lg:text-base font-display font-extrabold text-foreground mb-3 lg:mb-4">How it works</p>
              <div className="space-y-2.5 lg:space-y-4">
                {[
                  { icon: '1', label: 'A few quick questions', desc: 'Tell us about your child' },
                  { icon: '2', label: 'Quick check', desc: 'Tick which words your child can read' },
                  { icon: '3', label: 'Sound test', desc: 'We test every sound at their level' },
                  { icon: '4', label: 'Results', desc: 'See which sounds they know and need to learn' },
                ].map(({ icon, label, desc }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <span className="text-xs lg:text-sm font-bold text-foreground">{label}</span>
                      <span className="block text-xs lg:text-[13px] text-muted-foreground mt-0.5">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Choose a test — centre stage on lg, after the info on mobile.
                The Level Check entry (?level=N) bypasses this picker. */}
            <div
              className="order-3 lg:order-2 h-full rounded-[1.75rem] bg-white p-5 lg:p-6 flex flex-col"
              style={{ boxShadow: STICKER_SHADOW, border: '2px solid #fff', outline: '2px solid #E84B8A30' }}
            >
              <p className="text-sm lg:text-base font-display font-extrabold text-foreground text-center mb-1">Choose a test</p>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Sit with your child — 3 to 10 minutes depending on the test you pick.
              </p>
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                <button
                  onClick={() => { setMode('rapid'); setOnboardingStep('dob'); setStage('onboarding'); }}
                  className="w-full p-4 lg:p-5 rounded-[1.5rem] text-left transition-all active:translate-y-[3px]"
                  style={{ background: '#E84B8A', boxShadow: '0 4px 0 #BE1862, 0 14px 28px -10px #E84B8A80' }}
                >
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-white shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm lg:text-base font-display font-extrabold text-white">Quick Check · 3 min</p>
                      <p className="text-[11px] lg:text-xs text-white/80 mt-0.5">
                        Adaptive sound test to find your child's level fast.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => { setMode('full'); setOnboardingStep('dob'); setStage('onboarding'); }}
                  className="w-full p-4 lg:p-5 rounded-[1.5rem] bg-white text-left transition-all active:translate-y-[2px]"
                  style={{ boxShadow: '0 3px 0 rgba(40,30,40,0.08), 0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)', border: '1px solid rgba(40,30,40,0.06)' }}
                >
                  <div className="flex items-start gap-3">
                    <Search className="w-6 h-6 text-foreground shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm lg:text-base font-display font-extrabold text-foreground">Full Test · ~10 min</p>
                      <p className="text-[11px] lg:text-xs text-muted-foreground mt-0.5">
                        Tests sounds, real words, alien words and tricky words at every level.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground text-center">
                Your answers are private. See our{' '}
                <a href="/privacy" className="underline">privacy policy</a>.
              </p>
            </div>

            {/* What you'll get */}
            <div
              className="order-2 lg:order-3 h-full rounded-[1.75rem] bg-white p-5 lg:p-6 text-left"
              style={{ boxShadow: STICKER_SHADOW, border: '1px solid rgba(40,30,40,0.05)' }}
            >
              <p className="text-sm lg:text-base font-display font-extrabold text-foreground mb-3 lg:mb-4">What you'll get at the end</p>
              <ul className="space-y-2 lg:space-y-3.5 text-xs lg:text-[13px] text-muted-foreground">
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span>Your child's reading level on the 8-level journey</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span>A sound-by-sound map of what they know</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span>One free book matched to that level</span></li>
                <li className="flex gap-2"><span className="text-emerald-600 font-bold">✓</span><span>A simple "next steps" plan</span></li>
              </ul>
            </div>
          </div>
        </div>
      </Wrap>
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
      <Wrap>
        <div className="px-4 pt-6 pb-4 max-w-md lg:max-w-lg mx-auto lg:min-h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:justify-center lg:py-10">
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
      </Wrap>
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
      <Wrap>
        <div className="px-4 pt-6 pb-4 max-w-md lg:max-w-xl mx-auto text-center lg:min-h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:justify-center lg:py-10">
          <h2 className="text-xl lg:text-3xl font-extrabold text-foreground mb-2 tracking-tight">
            Quick Check
          </h2>
          <p className="text-sm lg:text-base text-muted-foreground mb-6 leading-relaxed">
            Which of these words can your child read aloud?<br />
            Tap the speaker to hear each word, then tick the ones they know.
          </p>

          <div className="space-y-3 mb-6">
            {SCREENING_WORDS.map(({ level, word }) => (
              <div
                key={level}
                className={`flex items-center gap-3 p-4 lg:p-5 rounded-xl border-2 transition-all cursor-pointer ${
                  screeningChecks[level]
                    ? `${LEVEL_BORDERS[level]} bg-green-50 dark:bg-green-950/20`
                    : 'border-border bg-card lg:hover:border-primary/40'
                }`}
                onClick={() => setScreeningChecks(prev => ({ ...prev, [level]: !prev[level] }))}
              >
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  screeningChecks[level] ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}>
                  {screeningChecks[level] && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className="font-child text-2xl lg:text-3xl font-bold text-foreground flex-1 text-left">{word}</span>
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
            className="w-full py-4 lg:py-5 rounded-xl gradient-primary text-primary-foreground font-bold text-base lg:text-lg shadow-button active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
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
      </Wrap>
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
      <Wrap>
        {/* On lg+ the quiz is vertically centred in the viewport and sits in a
            comfortably-sized column so the question card uses the space without
            feeling stretched. Below lg the original top-aligned column stays. */}
        <div className="px-4 pt-6 pb-4 max-w-md lg:max-w-xl mx-auto text-center lg:min-h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:justify-center lg:py-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs lg:text-sm font-bold uppercase tracking-wide ${LEVEL_TEXT[currentLevel]}`}>
              Level {currentLevel}
            </span>
            <span className="text-xs lg:text-sm font-bold text-muted-foreground uppercase tracking-wide">
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
          <p className="text-[10px] lg:text-xs text-muted-foreground mb-4">
            {testIdx + 1} of {testItems.length}
            {stage === 'probe-up' && (
              <span className="ml-1 text-blue-500">
                <Zap className="w-2.5 h-2.5 inline" /> bonus
              </span>
            )}
          </p>

          {/* Instruction */}
          <p className="text-xs lg:text-sm text-muted-foreground mb-4 leading-relaxed">
            {stageInstruction}
          </p>

          {/* Item card */}
          <div className={`bg-card border-2 ${LEVEL_BORDERS[currentLevel]} rounded-2xl p-10 lg:p-14 mb-6 shadow-card`}>
            <p className="font-child text-5xl lg:text-7xl font-bold text-foreground">
              {currentItem.item}
            </p>
            <div className="mt-6 lg:mt-8 flex justify-center">
              {isSoundRound ? (
                <PhonemePlayer grapheme={getSoundKey(currentItem.item)} size="lg" />
              ) : (
                <WordPlayer word={currentItem.item} size="lg" />
              )}
            </div>
            {isAlienRound && (
              <p className="mt-3 text-xs lg:text-sm text-muted-foreground italic">(made-up word)</p>
            )}
          </div>

          {/* Mark buttons */}
          <p className="text-xs lg:text-sm text-muted-foreground mb-3">Did they get it right?</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleMark(false)}
              className="flex-1 flex items-center justify-center gap-2 py-4 lg:py-5 rounded-xl bg-tint-orange border border-border text-foreground font-bold text-base lg:text-lg active:scale-95 lg:hover:brightness-95 transition-all duration-200"
            >
              <XCircle className="w-5 h-5 lg:w-6 lg:h-6 text-destructive" /> Not yet
            </button>
            <button
              onClick={() => handleMark(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 lg:py-5 rounded-xl bg-tint-green border border-border text-foreground font-bold text-base lg:text-lg active:scale-95 lg:hover:brightness-95 transition-all duration-200"
            >
              <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-level-3" /> Correct
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
      </Wrap>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LEVEL PASSED — quick celebration
  // ═══════════════════════════════════════════════════════════
  if (stage === 'level-passed') {
    return (
      <Wrap>
        <div className="px-4 pt-12 pb-4 max-w-md lg:max-w-lg mx-auto text-center lg:min-h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:justify-center lg:pt-12">
          <div className={`${LEVEL_COLORS[currentLevel]} text-white rounded-2xl p-8 lg:p-12 mb-6 shadow-card`}>
            <Trophy className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 opacity-90" />
            <p className="text-3xl lg:text-4xl font-extrabold mb-1">Level {currentLevel} Passed!</p>
            <p className="text-sm lg:text-base opacity-80">{LEVEL_NAMES[currentLevel].name}</p>
          </div>

          <button
            onClick={advanceToNextLevel}
            className={`w-full py-4 lg:py-5 rounded-xl ${LEVEL_COLORS[Math.min(currentLevel + 1, 6)]} text-white font-bold text-base lg:text-lg shadow-sm active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2`}
          >
            Continue to Level {currentLevel + 1} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Wrap>
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

    // Book reveal celebration for funnelMode — shown on top of the
    // dimmed results page. Parent clicks Continue to see the breakdown.
    const revealBook = funnelMode ? BOOK_CATALOG.find(b => b.level === recommendedLevel) : null;
    const revealCoverUrl = revealBook
      ? `/covers/${revealBook.sub_level.replace(/^L/, '').replace('.', '_')}_cover.jpg`
      : null;

    // Funnel-mode reveal: a full-page celebration of the unlocked book
    // BEFORE the breakdown — replaces the old layered modal, which on phones
    // landed below the long-scrolling results page where parents missed it.
    if (funnelMode && !bookRevealDismissed) {
      return (
        <Wrap>
          <BookRevealFullPage
            title={revealBook?.title ?? `Level ${recommendedLevel} Book`}
            level={recommendedLevel}
            coverUrl={revealCoverUrl}
            onContinue={() => setBookRevealDismissed(true)}
          />
        </Wrap>
      );
    }

    return (
      <Wrap>
        <div className="px-4 pt-6 pb-8 max-w-md lg:max-w-xl mx-auto text-center lg:pt-10">
          <h2 className="text-[28px] lg:text-4xl font-extrabold text-foreground mb-1 tracking-tight">
            Assessment Complete
          </h2>
          <p className="text-sm text-muted-foreground mb-1">
            Here's your child's phonics profile.
          </p>
          <p className="text-[10px] text-muted-foreground mb-3">
            {testedCount} items tested
          </p>

          {/* Quick-jump tabs — parents on phones don't have to scroll the
              whole report; they can tap straight to the section they want.
              Sticky so the nav follows them as they explore. */}
          <ResultsSectionNav />

          {/* Recommended level */}
          <div id="result-level" className={`${LEVEL_COLORS[recommendedLevel]} text-white rounded-2xl p-6 mb-5 shadow-card scroll-mt-24`}>
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

          {/* Age comparison — small text-only summary, kept near the headline
              so parents see the "expected vs actual" stat before the chart. */}
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

          {/* National + international comparison chart — the headline visual.
              Parents need to see this BEFORE the first Continue so the line
              graph is what closes the offer. */}
          {(() => {
            const ageMonths = getAgeMonths();
            if (!ageMonths) return null;
            const countryCode = typeof navigator !== 'undefined'
              ? (navigator.language?.split('-')[1]?.toUpperCase() ?? null)
              : null;
            return (
              <div className="mb-5 text-left">
                <PhonicsAveragesChart
                  ageMonths={ageMonths}
                  childLevel={recommendedLevel}
                  countryCode={countryCode}
                />
              </div>
            );
          })()}

          {/* Continue #1 — directly under the line graph, per the
              chart→button→sounds→button structure the user asked for. */}
          {funnelMode && (
            <button
              onClick={() => onFunnelComplete?.(recommendedLevel, {
                sounds_correct: answers.filter(a => a.category === 'sound_recognition' && a.isCorrect).length,
                sounds_asked: answers.filter(a => a.category === 'sound_recognition').length,
                words_correct: answers.filter(a => a.category === 'word_reading' && a.isCorrect).length,
                words_asked: answers.filter(a => a.category === 'word_reading').length,
              })}
              className={`w-full flex items-center justify-center gap-2 py-4 mb-5 rounded-xl ${LEVEL_COLORS[recommendedLevel]} text-white font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200`}
            >
              Claim My Free Book <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Sounds breakdown — condensed in funnelMode (untested levels
              folded into a single 'not tested' line). */}
          <div id="result-map" className="bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-card scroll-mt-24">
            <p className="text-xs font-bold text-foreground mb-3">Sound Map</p>
            <SoundMap sounds={soundMap} results={resultsMap} compact={funnelMode} />
          </div>

          {/* Continue #2 — directly under the sounds breakdown. */}
          {funnelMode && (
            <button
              onClick={() => onFunnelComplete?.(recommendedLevel, {
                sounds_correct: answers.filter(a => a.category === 'sound_recognition' && a.isCorrect).length,
                sounds_asked: answers.filter(a => a.category === 'sound_recognition').length,
                words_correct: answers.filter(a => a.category === 'word_reading' && a.isCorrect).length,
                words_asked: answers.filter(a => a.category === 'word_reading').length,
              })}
              className={`w-full flex items-center justify-center gap-2 py-4 mb-5 rounded-xl ${LEVEL_COLORS[recommendedLevel]} text-white font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200`}
            >
              Claim My Free Book <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Level-by-level breakdown — collapsed by default in funnelMode
              so the page is short and a Continue button is reachable. */}
          {levelScores.length > 0 && (
            <details id="result-levels" className="mb-5 scroll-mt-24 text-left" open={!funnelMode}>
              <summary className="text-xs font-bold text-foreground cursor-pointer py-2 list-none flex items-center justify-between">
                <span>Level Results ({levelScores.length})</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform [details[open]_&]:rotate-90" />
              </summary>
              <div className="space-y-3 mt-2">
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
                  {/* Show all three core categories explicitly. Untested
                      categories say "Not tested" rather than silently
                      omitting them — the rapid path often only runs sound
                      recognition, and the parent needs to know the other
                      categories were skipped, not passed. */}
                  <div className="grid grid-cols-1 gap-y-1">
                    {(['sound_recognition', 'word_reading', 'tricky_words'] as const).map(catKey => {
                      const cat = score.categories.find(c => c.category === catKey);
                      return (
                        <div key={catKey} className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">{CATEGORY_LABELS[catKey]}</span>
                          {cat ? (
                            <span className={`font-bold ${cat.passed ? 'text-foreground' : 'text-orange-500'}`}>
                              {cat.percentage}%
                            </span>
                          ) : (
                            <span className="font-medium text-muted-foreground italic">Not tested</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              </div>
            </details>
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

          {/* Action area: email capture for guests, library button for authed.
              In funnelMode the parent funnel page owns the post-result flow
              (continue → upsell → email-or-checkout), so we just hand off the
              level via onFunnelComplete instead of asking for an email here. */}
          {!user && !guestSubmitted && funnelMode && (
            <button
              id="result-continue"
              onClick={() => onFunnelComplete?.(recommendedLevel, {
                sounds_correct: answers.filter(a => a.category === 'sound_recognition' && a.isCorrect).length,
                sounds_asked: answers.filter(a => a.category === 'sound_recognition').length,
                words_correct: answers.filter(a => a.category === 'word_reading' && a.isCorrect).length,
                words_asked: answers.filter(a => a.category === 'word_reading').length,
              })}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl ${LEVEL_COLORS[recommendedLevel]} text-white font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200 scroll-mt-24`}
            >
              Claim My Free Book <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {!user && !guestSubmitted && !funnelMode && (
            <div className="bg-card border-2 border-primary rounded-2xl p-5 mb-3 text-left shadow-card">
              <p className="text-sm font-bold text-foreground mb-1">
                Save your results & get a free book
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Enter your email and we'll unlock a free Level {recommendedLevel} book and send you a login link.
              </p>
              <input
                type="text"
                placeholder="Child's name (optional)"
                value={guestChildName}
                onChange={(e) => setGuestChildName(e.target.value)}
                className="w-full mb-2 px-4 py-3 rounded-xl border border-border bg-background text-sm"
              />
              <input
                type="email"
                placeholder="Your email address"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full mb-3 px-4 py-3 rounded-xl border border-border bg-background text-sm"
              />
              <button
                onClick={() => submitGuestAssessment(recommendedLevel)}
                disabled={guestSubmitting || !guestEmail}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl ${LEVEL_COLORS[recommendedLevel]} text-white font-bold text-sm shadow-sm active:scale-[0.97] transition-transform duration-200 disabled:opacity-50`}
              >
                {guestSubmitting ? 'Saving...' : <>Unlock My Free Book <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {!user && guestSubmitted && (() => {
            const firstBook = BOOK_CATALOG.find(b => b.level === recommendedLevel);
            const coverUrl = firstBook
              ? `/covers/${firstBook.sub_level.replace(/^L/, '').replace('.', '_')}_cover.jpg`
              : null;
            return (
              <BookUnlockedModal
                open={true}
                onClose={() => navigate('/library', { state: { filterLevel: recommendedLevel } })}
                onContinue={() => navigate('/library', { state: { filterLevel: recommendedLevel } })}
                title={firstBook?.title ?? `Level ${recommendedLevel} Book`}
                level={recommendedLevel}
                coverUrl={coverUrl}
                subtitle={`Check your email at ${guestEmail} for your login link`}
                ctaLabel="Browse the Library"
              />
            );
          })()}

          {user && (
            <div className="flex gap-3 mb-3">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border font-bold text-sm shadow-card active:scale-[0.97] transition-transform duration-200"
              >
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={() => navigate('/library', { state: { filterLevel: recommendedLevel } })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ${LEVEL_COLORS[recommendedLevel]} text-white font-bold text-sm shadow-sm active:scale-[0.97] transition-transform duration-200`}
              >
                Browse Level {recommendedLevel} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </Wrap>
    );
  }

  return null;
}

/* ─── Full-page book reveal for the assessment funnel ───────────── */

interface BookRevealFullPageProps {
  title: string;
  level: number;
  coverUrl: string | null;
  onContinue: () => void;
}

function BookRevealFullPage({ title, level, coverUrl, onContinue }: BookRevealFullPageProps) {
  const levelInfo = LEVELS.find(l => l.level === level);
  return (
    <div className="px-4 pt-6 pb-10 max-w-md lg:max-w-lg mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500 lg:min-h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:justify-center lg:py-10">
      <div className={`${LEVEL_COLORS[level]} text-white rounded-3xl p-6 pb-8 lg:p-10 lg:pb-10 shadow-card`}>
        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Book Unlocked!</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1">
          Your free book is ready
        </h2>
        <p className="text-sm lg:text-base opacity-90 mb-5">
          Level {level} — {levelInfo?.name}
        </p>

        <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white mx-auto max-w-[220px] lg:max-w-[260px]">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full aspect-[3/4] object-cover" />
          ) : (
            <div className="w-full aspect-[3/4] flex items-center justify-center bg-white/10">
              <BookOpen className="w-12 h-12 opacity-80" />
            </div>
          )}
        </div>
        <p className="font-bold text-white text-lg lg:text-xl mt-4">{title}</p>
        <p className="text-xs lg:text-sm opacity-90 mt-1">
          Based on your results, you've unlocked this free book.
        </p>
      </div>

      <button
        onClick={onContinue}
        className={`mt-6 w-full flex items-center justify-center gap-2 py-4 lg:py-5 rounded-xl ${LEVEL_COLORS[level]} text-white font-bold text-base lg:text-lg shadow-button active:scale-[0.97] transition-transform duration-200`}
      >
        Continue to my results <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

/* ─── Quick-jump section nav for the long results page ──────────── */

const RESULT_SECTIONS: { id: string; label: string }[] = [
  { id: 'result-level', label: 'Level' },
  { id: 'result-map', label: 'Map' },
  { id: 'result-levels', label: 'Levels' },
  { id: 'result-continue', label: 'Continue' },
];

function ResultsSectionNav() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <nav className="sticky top-2 z-30 mb-4 -mx-1 px-1">
      <div className="flex gap-1.5 overflow-x-auto rounded-full bg-white/85 backdrop-blur-md border border-border shadow-sm p-1">
        {RESULT_SECTIONS.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className="flex-1 min-w-[5rem] text-[11px] font-bold text-foreground/80 hover:text-foreground hover:bg-pink-50 active:bg-pink-100 rounded-full px-3 py-1.5 transition-colors whitespace-nowrap"
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
