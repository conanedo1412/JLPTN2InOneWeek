import rows from "./expandedVocabulary.json";
import type { VocabularyItem, QuizQuestion } from "../types";

export const expandedVocabulary: VocabularyItem[] = rows.map(row => ({
  id: row.id, word: row.word, reading: row.reading, meaning: row.definition,
  japaneseDefinition: row.definition, partOfSpeech: row.pos,
  exampleSentence: "", translation: "", collocation: "", similarWord: "",
  tags: ["語彙拡張", row.pos], difficulty: 3
}));

const normalize = (reading: string) => reading.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
export const expandedVocabularyQuestions: QuizQuestion[] = rows.map(row => {
  const correct = normalize(row.reading);
  if (!/\p{Script=Han}/u.test(row.word)) return {
    id: `q-${row.id}-meaning`, relatedContentId: row.id,
    category: "vocabulary", subcategory: "vocabulary-recognition", type: "multiple-choice",
    prompt: `「${row.word}」の意味として最も適切なものを選びなさい。`,
    choices: row.meaningChoices!, correctAnswer: row.definition,
    explanation: `「${row.word}」：${row.definition}`, difficulty: 3, tags: ["語彙拡張", "意味"]
  };
  return {
    id: `q-${row.id}-reading`, relatedContentId: row.id,
    category: "vocabulary", subcategory: "vocabulary-recognition", type: "multiple-choice",
    prompt: `「${row.word}」の読み方として正しいものを選びなさい。`,
    choices: row.choices,
    correctAnswer: correct, explanation: `「${row.word}」の読みは「${correct}」。\n語義：${row.definition}`,
    difficulty: 3, tags: ["語彙拡張", "読み"]
  };
});
