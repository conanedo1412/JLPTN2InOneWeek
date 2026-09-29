export type StudyCategory = "kanji" | "vocabulary" | "grammar" | "sentence-ordering" | "reading";

export type Subcategory =
  | "kanji-meaning"
  | "kanji-reading"
  | "vocabulary-recognition"
  | "vocabulary-context"
  | "grammar-recognition"
  | "grammar-nuance"
  | "sentence-ordering"
  | "short-reading";

export type Confidence = "sure" | "unsure" | "guess";
export type Rating = "again" | "hard" | "good" | "easy";
export type QuizType = "multiple-choice" | "fill-blank" | "ordering" | "paraphrase" | "unnatural";

export interface KanjiItem {
  id: string;
  kanji: string;
  readings: string[];
  meaning: string;
  exampleCompound: string;
  exampleSentence: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  japaneseDefinition: string;
  partOfSpeech: string;
  exampleSentence: string;
  translation: string;
  collocation: string;
  similarWord: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface GrammarItem {
  id: string;
  pattern: string;
  meaning: string;
  japaneseExplanation: string;
  formation: string;
  example: string;
  translation: string;
  commonConfusion: string;
  memoryHint: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface QuizQuestion {
  id: string;
  category: StudyCategory;
  subcategory: Subcategory;
  type: QuizType;
  prompt: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  relatedContentId: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export interface StudyContent {
  kanji: KanjiItem[];
  vocabulary: VocabularyItem[];
  grammar: GrammarItem[];
  questions: QuizQuestion[];
}

export interface SetupInfo {
  lastStudyDate?: string;
  examDate: string;
  dailyMinutes: 30 | 60 | 90 | 120;
  activeDay: number;
  completedDays: number[];
}

export interface AnswerRecord {
  id: string;
  questionId: string;
  category: StudyCategory;
  subcategory: Subcategory;
  selectedAnswer: string;
  correctAnswer: string;
  correct: boolean;
  confidence: Confidence;
  elapsedMs: number;
  answeredAt: string;
  sessionId: string;
  flagged?: boolean;
}

export interface MistakeRecord {
  questionId: string;
  category: StudyCategory;
  subcategory: Subcategory;
  selectedAnswer: string;
  correctAnswer: string;
  firstMissedAt: string;
  lastMissedAt: string;
  timesMissed: number;
  confidence: Confidence;
  explanation: string;
  guessedCorrectly: boolean;
  corrected: boolean;
  correctedAt?: string;
}

export interface ReviewState {
  reviewedOn?: string;
  contentId: string;
  dueDay: number;
  lastRating: Rating;
  seenCount: number;
}

export interface ProgressSnapshot {
  date: string;
  overallCompletion: number;
  accuracies: Record<Subcategory, number>;
}

export interface AppProgress {
  version: 1;
  setup?: SetupInfo;
  answers: AnswerRecord[];
  mistakes: MistakeRecord[];
  review: ReviewState[];
  completedTasks: string[];
  progressHistory: ProgressSnapshot[];
  theme: "light" | "dark" | "system";
  importedContent?: Partial<StudyContent>;
}

export interface SessionResult {
  sessionId: string;
  answers: AnswerRecord[];
  startedAt: string;
  completedAt: string;
}

export interface WeakArea {
  subcategory: Subcategory;
  score: number;
  label: "strong" | "moderate" | "weak" | "critical";
  reasons: string[];
}
