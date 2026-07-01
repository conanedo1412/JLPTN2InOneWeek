import { describe, expect, it } from "vitest";
import { calculateWeakAreas } from "../features/progress/scoring";
import type { AnswerRecord, MistakeRecord } from "../types";

const baseAnswer: Omit<AnswerRecord, "id" | "questionId" | "subcategory" | "correct" | "confidence"> = {
  category: "grammar",
  selectedAnswer: "x",
  correctAnswer: "y",
  elapsedMs: 10_000,
  answeredAt: "2026-06-28T00:00:00.000Z",
  sessionId: "s"
};

describe("adaptive weakness scoring", () => {
  it("does not treat every sub-80 category as automatically weak", () => {
    const records: AnswerRecord[] = [
      { ...baseAnswer, id: "1", questionId: "q1", subcategory: "grammar-nuance", correct: true, confidence: "sure" },
      { ...baseAnswer, id: "2", questionId: "q2", subcategory: "grammar-nuance", correct: true, confidence: "sure" },
      { ...baseAnswer, id: "3", questionId: "q3", subcategory: "grammar-nuance", correct: false, confidence: "sure" }
    ];
    const weak = calculateWeakAreas(records, []).find((area) => area.subcategory === "grammar-nuance")!;
    expect(weak.label).toBe("moderate");
  });

  it("weights guessed correct answers for review", () => {
    const records: AnswerRecord[] = [
      { ...baseAnswer, id: "1", questionId: "q1", subcategory: "kanji-reading", correct: true, confidence: "guess" }
    ];
    const weak = calculateWeakAreas(records, []).find((area) => area.subcategory === "kanji-reading")!;
    expect(weak.score).toBeGreaterThan(3);
  });

  it("increases repeated mistake risk", () => {
    const records: AnswerRecord[] = [
      { ...baseAnswer, id: "1", questionId: "q1", subcategory: "sentence-ordering", correct: false, confidence: "unsure" }
    ];
    const mistakes: MistakeRecord[] = [{
      questionId: "q1",
      category: "sentence-ordering",
      subcategory: "sentence-ordering",
      selectedAnswer: "x",
      correctAnswer: "y",
      firstMissedAt: "2026-06-28T00:00:00.000Z",
      lastMissedAt: "2026-06-28T00:00:00.000Z",
      timesMissed: 3,
      confidence: "unsure",
      explanation: "Fixed grammar chunk.",
      guessedCorrectly: false,
      corrected: false
    }];
    const weak = calculateWeakAreas(records, mistakes).find((area) => area.subcategory === "sentence-ordering")!;
    expect(weak.label).toBe("weak");
  });
});
