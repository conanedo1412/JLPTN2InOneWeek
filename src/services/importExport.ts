import type { AppProgress, KanjiItem, QuizQuestion, StudyContent, VocabularyItem } from "../types";
import { sanitizeProgress, STORAGE_VERSION } from "../storage/progressStorage";

export interface ValidationIssue {
  message: string;
}

export function validateContent(content: Partial<StudyContent>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const addId = (id: string | undefined, label: string) => {
    if (!id) {
      issues.push({ message: `${label} is missing an ID.` });
      return;
    }
    if (ids.has(id)) issues.push({ message: `Duplicate ID: ${id}.` });
    ids.add(id);
  };
  content.kanji?.forEach((item) => {
    addId(item.id, "Kanji item");
    if (!item.kanji || !item.readings?.length || !item.meaning) issues.push({ message: `Kanji ${item.id} is missing required fields.` });
    if (item.difficulty < 1 || item.difficulty > 5) issues.push({ message: `Kanji ${item.id} has invalid difficulty.` });
  });
  content.vocabulary?.forEach((item) => {
    addId(item.id, "Vocabulary item");
    if (!item.word || !item.reading || !item.meaning || (!item.exampleSentence && !item.japaneseDefinition)) issues.push({ message: `Vocabulary ${item.id} is missing required fields.` });
    if (item.difficulty < 1 || item.difficulty > 5) issues.push({ message: `Vocabulary ${item.id} has invalid difficulty.` });
  });
  content.grammar?.forEach((item) => {
    addId(item.id, "Grammar item");
    if (!item.pattern || !item.meaning || !item.formation || !item.example) issues.push({ message: `Grammar ${item.id} is missing required fields.` });
    if (item.difficulty < 1 || item.difficulty > 5) issues.push({ message: `Grammar ${item.id} has invalid difficulty.` });
  });

  const contentIds = new Set([
    ...(content.kanji ?? []).map((item) => item.id),
    ...(content.vocabulary ?? []).map((item) => item.id),
    ...(content.grammar ?? []).map((item) => item.id)
  ]);
  const kanjiById = new Map((content.kanji ?? []).map((item) => [item.id, item]));
  content.questions?.forEach((question) => {
    addId(question.id, "Question");
    const uniqueChoices = new Set(question.choices);
    if (question.choices.length < 3) issues.push({ message: `Question ${question.id} has fewer than three choices.` });
    if (uniqueChoices.size !== question.choices.length) issues.push({ message: `Question ${question.id} has duplicate answer choices.` });
    if (!question.choices.includes(question.correctAnswer)) issues.push({ message: `Question ${question.id} is missing its correct answer from choices.` });
    if (!question.explanation) issues.push({ message: `Question ${question.id} has an empty explanation.` });
    const quizText = [question.prompt, question.correctAnswer, question.explanation, ...question.choices].join(" ");
    if (/[A-Za-z]/.test(quizText)) issues.push({ message: `Question ${question.id} contains English letters in quiz-facing text.` });
    if (!contentIds.has(question.relatedContentId)) issues.push({ message: `Question ${question.id} references a content item that does not exist.` });
    const relatedKanji = kanjiById.get(question.relatedContentId);
    if (relatedKanji && question.subcategory === "kanji-reading" && question.choices.filter(choice => relatedKanji.readings.includes(choice)).length !== 1) {
      issues.push({ message: `Question ${question.id} must have exactly one valid reading among its choices.` });
    }
    if (relatedKanji && question.subcategory === "kanji-reading" && !relatedKanji.readings.includes(question.correctAnswer)) {
      issues.push({ message: `Question ${question.id} uses a reading that is not listed for ${relatedKanji.kanji}.` });
    }
    if (relatedKanji && question.subcategory === "kanji-meaning" && question.correctAnswer !== relatedKanji.kanji && question.choices.includes(relatedKanji.kanji)) {
      issues.push({ message: `Question ${question.id} should answer with related kanji ${relatedKanji.kanji}.` });
    }
    if (question.difficulty < 1 || question.difficulty > 5) issues.push({ message: `Question ${question.id} has invalid difficulty.` });
  });
  return issues;
}

export function parseVocabularyCsv(csv: string): VocabularyItem[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(",").map((h) => h.trim()) ?? [];
  const required = ["word", "reading", "meaning"];
  if (!required.every((key) => header.includes(key))) {
    throw new Error("This file does not contain a valid vocabulary list.");
  }
  return lines.map((line, index) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const row = Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""]));
    return {
      id: row.id || `import-v-${index + 1}`,
      word: row.word,
      reading: row.reading,
      meaning: row.meaning,
      japaneseDefinition: row.japaneseDefinition || row.meaning,
      partOfSpeech: row.partOfSpeech || "unknown",
      exampleSentence: row.exampleSentence || `${row.word}を使った文を作る。`,
      translation: row.translation || "",
      collocation: row.collocation || "",
      similarWord: row.similarWord || "",
      tags: (row.tags || "imported").split(";").filter(Boolean),
      difficulty: Number(row.difficulty || 3) as VocabularyItem["difficulty"]
    };
  });
}

export function parseContentJson(text: string): Partial<StudyContent> {
  const parsed = JSON.parse(text) as Partial<StudyContent>;
  const issues = validateContent(parsed);
  if (issues.length) throw new Error(issues[0].message);
  return parsed;
}

export function exportProgress(progress: AppProgress): string {
  return JSON.stringify(sanitizeProgress(progress), null, 2);
}

export function importProgress(text: string): AppProgress {
  const parsed = JSON.parse(text) as AppProgress;
  if (!parsed || parsed.version !== STORAGE_VERSION) throw new Error("Progress file version is unsupported.");
  if (![parsed.answers, parsed.mistakes, parsed.review, parsed.completedTasks, parsed.progressHistory].every(Array.isArray)) throw new Error("Invalid progress arrays.");
  const recordsValid = (rows: unknown[], fields: Record<string, string>) => rows.every(row => row && typeof row === "object" && Object.entries(fields).every(([key, type]) => typeof (row as Record<string, unknown>)[key] === type));
  if (!parsed.completedTasks.every(id => typeof id === "string") ||
      !recordsValid(parsed.answers, { questionId: "string", selectedAnswer: "string", correctAnswer: "string", correct: "boolean", answeredAt: "string", sessionId: "string", confidence: "string", category: "string", subcategory: "string", elapsedMs: "number" }) ||
      !recordsValid(parsed.mistakes, { questionId: "string", category: "string", subcategory: "string", selectedAnswer: "string", correctAnswer: "string", explanation: "string", timesMissed: "number", corrected: "boolean", guessedCorrectly: "boolean" }) ||
      !recordsValid(parsed.review, { contentId: "string", dueDay: "number", lastRating: "string", seenCount: "number" }) ||
      !recordsValid(parsed.progressHistory, { date: "string", overallCompletion: "number" })) throw new Error("Invalid progress records.");
  if (parsed.setup && (!Number.isInteger(parsed.setup.activeDay) || parsed.setup.activeDay < 1 || parsed.setup.activeDay > 30 || typeof parsed.setup.examDate !== "string" || ![30, 60, 90, 120].includes(parsed.setup.dailyMinutes) || !Array.isArray(parsed.setup.completedDays))) throw new Error("Invalid study setup.");
  if (parsed.importedContent && validateContent(parsed.importedContent).length) throw new Error("Invalid imported content.");
  return sanitizeProgress(parsed);
}
