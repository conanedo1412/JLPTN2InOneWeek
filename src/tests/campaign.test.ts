import { describe, expect, it } from "vitest";
import { campaignStats } from "../features/progress/campaign";
import { emptyProgress } from "../storage/progressStorage";
import { balancedPractice, makeAnswerRecord, selectQuestions } from "../features/quiz/quizLogic";
import { starterContent } from "../data/content";
import { getDayPlan, monthPlan } from "../features/study-plan/plan";

describe("campaign learning evidence", () => {
  const q = starterContent.questions[0];
  const answer = makeAnswerRecord({ question: q, selectedAnswer: q.correctAnswer, confidence: "sure", elapsedMs: 10000, sessionId: "test", now: "2026-09-26T12:00:00+09:00" });
  it("does not farm XP by repeating the same question or toggling tasks", () => {
    const first = campaignStats({ ...emptyProgress, answers: [answer] });
    const repeated = campaignStats({ ...emptyProgress, answers: [answer, answer], completedTasks: ["month-1-cards"] });
    expect(first.xp).toBe(20);
    expect(repeated.xp).toBe(first.xp);
  });
  it("does not award XP for blank submissions", () => {
    expect(campaignStats({ ...emptyProgress, answers: [{ ...answer, correct: false, selectedAnswer: "" }] }).xp).toBe(0);
  });
  it("keeps yesterday's streak alive until today ends", () => {
    expect(campaignStats({ ...emptyProgress, answers: [answer] }, "2026-09-27").streak).toBe(1);
    expect(campaignStats({ ...emptyProgress, answers: [answer] }, "2026-09-28").streak).toBe(0);
  });
  it("uses the latest attempt for skill accuracy", () => {
    const stats = campaignStats({ ...emptyProgress, answers: [answer, { ...answer, correct: false }] });
    expect(stats.skills[0].accuracy).toBe(0);
    expect(stats.skills[0].count).toBe(1);
  });
  it("balances all four skills even with a large kanji bank", () => {
    const questions = balancedPractice(starterContent.questions, 48, "trial");
    expect(new Set(questions.map(q => q.id)).size).toBe(48);
    expect(questions.filter(q => q.category === "reading")).toHaveLength(12);
    expect(questions.filter(q => q.category === "kanji")).toHaveLength(12);
  });
  it("prioritizes weak questions", () => {
    expect(selectQuestions(starterContent.questions, { count: 1, seed: "weak", weightedIds: [q.id] })[0].id).toBe(q.id);
  });
  it("provides thirty days and distinct tasks without losing day thirty", () => {
    expect(monthPlan).toHaveLength(30);
    expect(getDayPlan(30).day).toBe(30);
    expect(new Set(monthPlan.flatMap(d => d.tasks.map(t => t.id))).size).toBe(120);
  });
  it("keeps the reported brain reading correct and avoids valid alternatives", () => {
    const card = starterContent.kanji.find(k => k.kanji === "脳")!;
    const question = starterContent.questions.find(q => q.relatedContentId === card.id && q.subcategory === "kanji-reading")!;
    expect(question.correctAnswer).toBe("ノウ");
    expect(question.choices.filter(choice => card.readings.includes(choice))).toEqual(["ノウ"]);
  });
  it("covers every vocabulary and grammar entry in recognition practice", () => {
    const tested = new Set(starterContent.questions.map(q => q.relatedContentId));
    expect([...starterContent.vocabulary, ...starterContent.grammar].every(item => tested.has(item.id))).toBe(true);
  });
});
