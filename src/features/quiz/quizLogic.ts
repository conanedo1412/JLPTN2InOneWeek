import type { AnswerRecord, Confidence, QuizQuestion, StudyCategory, Subcategory } from "../../types";
import { shuffleDeterministic } from "../../utils/random";

export function selectQuestions(
  questions: QuizQuestion[],
  options: {
    count: number;
    seed: string;
    categories?: StudyCategory[];
    subcategories?: Subcategory[];
    excludeIds?: string[];
    weightedIds?: string[];
  }
): QuizQuestion[] {
  const exclude = new Set(options.excludeIds ?? []);
  const weighted = new Set(options.weightedIds ?? []);
  const filtered = questions.filter((q) => {
    if (q.tags.includes("retired")) return false;
    if (exclude.has(q.id)) return false;
    if (options.categories && !options.categories.includes(q.category)) return false;
    if (options.subcategories && !options.subcategories.includes(q.subcategory)) return false;
    return true;
  });
  const deduped = Array.from(new Map(filtered.map((q) => [q.id, q])).values());
  return [
    ...shuffleDeterministic(deduped.filter((q) => weighted.has(q.id)), options.seed),
    ...shuffleDeterministic(deduped.filter((q) => !weighted.has(q.id)), options.seed)
  ].slice(0, options.count);
}

export function balancedPractice(questions: QuizQuestion[], count: number, seed: string): QuizQuestion[] {
  const groups: StudyCategory[][] = [["kanji"], ["vocabulary"], ["grammar", "sentence-ordering"], ["reading"]];
  const pools = groups.map((categories, i) => selectQuestions(questions, { count, seed: `${seed}-${i}`, categories }));
  const selected: QuizQuestion[] = [];
  for (let i = 0; selected.length < count && i < count; i++) {
    for (const pool of pools) if (pool[i] && selected.length < count) selected.push(pool[i]);
  }
  return selected;
}

export function validateSentenceOrder(selected: string, correct: string): boolean {
  const normalize = (value: string) => value.split("|").map((part) => part.trim()).filter(Boolean).join("|");
  return normalize(selected) === normalize(correct);
}

export function isCorrectAnswer(question: QuizQuestion, selected: string): boolean {
  if (question.type === "ordering") return validateSentenceOrder(selected, question.correctAnswer);
  return selected === question.correctAnswer;
}

export function makeAnswerRecord(args: {
  question: QuizQuestion;
  selectedAnswer: string;
  confidence: Confidence;
  elapsedMs: number;
  sessionId: string;
  flagged?: boolean;
  now?: string;
}): AnswerRecord {
  const correct = isCorrectAnswer(args.question, args.selectedAnswer);
  return {
    id: `${args.sessionId}-${args.question.id}-${Date.now()}`,
    questionId: args.question.id,
    category: args.question.category,
    subcategory: args.question.subcategory,
    selectedAnswer: args.selectedAnswer,
    correctAnswer: args.question.correctAnswer,
    correct,
    confidence: args.confidence,
    elapsedMs: args.elapsedMs,
    answeredAt: args.now ?? new Date().toISOString(),
    sessionId: args.sessionId,
    flagged: args.flagged
  };
}

export function accuracy(records: AnswerRecord[]): number {
  if (!records.length) return 0;
  return Math.round((records.filter((r) => r.correct).length / records.length) * 100);
}
