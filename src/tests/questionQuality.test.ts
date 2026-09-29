import { describe, expect, it } from "vitest";
import { starterContent } from "../data/content";
import { selectQuestions } from "../features/quiz/quizLogic";

describe("revised question quality", () => {
  it("uses contextual vocabulary and grammar prompts without exposing answers", () => {
    const questions = starterContent.questions.filter(q => q.subcategory === "vocabulary-context" || q.subcategory === "grammar-nuance");
    expect(questions).toHaveLength(110);
    for (const question of questions) {
      expect(question.prompt).toContain("（　）");
      expect(question.prompt).not.toMatch(/よく使う形|組み合わせ|ヒント|画数/);
      expect(question.choices).toHaveLength(4);
      expect(question.choices.filter(c => c === question.correctAnswer)).toHaveLength(1);
    }
  });
  it("keeps retired IDs for old records but never selects them for new quizzes", () => {
    expect(starterContent.questions.some(q => q.id.startsWith("q-ekm-") && q.tags.includes("retired"))).toBe(true);
    expect(selectQuestions(starterContent.questions, { count: 2000, seed: "all" }).every(q => !q.tags.includes("retired"))).toBe(true);
  });
  it("does not present two valid kana variants as different answers", () => {
    const normalize = (s: string) => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/[.・-]/g, "");
    const kanji = new Map(starterContent.kanji.map(k => [k.id, k]));
    for (const q of starterContent.questions.filter(q => q.subcategory === "kanji-reading")) {
      const valid = new Set(kanji.get(q.relatedContentId)!.readings.map(normalize));
      expect(q.choices.filter(c => valid.has(normalize(c))), q.id).toEqual([q.correctAnswer]);
    }
  });
});
