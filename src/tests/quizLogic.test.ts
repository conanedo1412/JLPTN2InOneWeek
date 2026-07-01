import { describe, expect, it } from "vitest";
import { starterContent } from "../data/content";
import { isCorrectAnswer, selectQuestions, validateSentenceOrder } from "../features/quiz/quizLogic";

describe("quiz logic", () => {
  it("selects deterministic question sets", () => {
    const a = selectQuestions(starterContent.questions, { count: 10, seed: "same" }).map((q) => q.id);
    const b = selectQuestions(starterContent.questions, { count: 10, seed: "same" }).map((q) => q.id);
    expect(a).toEqual(b);
  });

  it("validates sentence ordering answers", () => {
    expect(validateSentenceOrder("約束した | 以上は | 守る", "約束した|以上は|守る")).toBe(true);
    expect(validateSentenceOrder("以上は|約束した|守る", "約束した|以上は|守る")).toBe(false);
  });

  it("scores ordinary answers", () => {
    const question = starterContent.questions[0];
    expect(isCorrectAnswer(question, question.correctAnswer)).toBe(true);
  });
});
