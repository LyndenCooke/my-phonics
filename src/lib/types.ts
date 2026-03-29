export interface Book {
  id: string;
  level: number;
  subLevel: string;
  title: string;
  slug: string;
  focusSounds: string[];
  trickyWords: string[];
  storyWords: string[];
  coverImageUrl?: string;
  pdfUrl?: string;
  pageCount: number;
  sortOrder: number;
  unlocked: boolean;
  completed: boolean;
  lastPageRead: number;
  pages: BookPage[];
}

export interface BookPage {
  id: string;
  pageNumber: number;
  pageType: 'cover' | 'guide' | 'reference' | 'story' | 'activity' | 'writing' | 'nonsense' | 'certificate' | 'back_cover';
  textContent?: string;
  imageUrl?: string;
}

export interface QuizQuestion {
  id: string;
  bookId: string;
  quizType: 'comprehension' | 'word_reading' | 'sound_matching';
  questionText: string;
  options: string[];
  correctAnswer: string;
  sortOrder: number;
}

export interface AssessmentResult {
  id: string;
  childName: string;
  soundScore: number;
  soundTotal: number;
  wordScore: number;
  wordTotal: number;
  trickyScore: number;
  trickyTotal: number;
  recommendedLevel: number;
  completedAt: string;
}

export interface Child {
  id: string;
  name: string;
  dateOfBirth?: string;
  currentLevel: number;
}

export interface LevelInfo {
  level: number;
  name: string;
  ageRange: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Starting Stories', ageRange: 'Ages 4–5', colorClass: 'text-level-1', bgClass: 'bg-level-1', borderClass: 'border-level-1' },
  { level: 2, name: 'Longer Sounds', ageRange: 'Ages 4–5', colorClass: 'text-level-2', bgClass: 'bg-level-2', borderClass: 'border-level-2' },
  { level: 3, name: 'New Spellings', ageRange: 'Ages 5–6', colorClass: 'text-level-3', bgClass: 'bg-level-3', borderClass: 'border-level-3' },
  { level: 4, name: 'Building Fluency', ageRange: 'Ages 5–6', colorClass: 'text-level-4', bgClass: 'bg-level-4', borderClass: 'border-level-4' },
  { level: 5, name: 'Reading Together', ageRange: 'Ages 6–7', colorClass: 'text-level-5', bgClass: 'bg-level-5', borderClass: 'border-level-5' },
  { level: 6, name: 'Reading Champion', ageRange: 'Ages 7–8', colorClass: 'text-level-6', bgClass: 'bg-level-6', borderClass: 'border-level-6' },
];
