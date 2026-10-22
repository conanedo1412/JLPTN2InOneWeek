import { describe, expect, it } from "vitest";
import { starterContent } from "../data/content";
import { emptyProgress } from "../storage/progressStorage";
import { isSingleKanji, learningCoverage, seenContentIds, unseenCards, unseenQuestions } from "../features/progress/coverage";
import { makeAnswerRecord, selectQuestions } from "../features/quiz/quizLogic";
import { shuffleDeterministic } from "../utils/random";
import { scheduleReview } from "../features/learn/scheduler";

describe("new daily material and learning coverage", () => {
  const singles = starterContent.kanji.filter(k => isSingleKanji(k.kanji));
  it("counts unique characters rather than inflating totals with compounds", () => {
    const groups = learningCoverage(emptyProgress, starterContent);
    expect(groups.map(g=>g.total)).toEqual([979, 6000, 67]);
    expect(singles).toHaveLength(979);
    for (const group of groups) expect(group.remaining).toBe(group.total);
    const covered = new Set(starterContent.questions.filter(q=>!q.tags.includes("retired")).map(q=>q.relatedContentId));
    expect(singles.every(k=>covered.has(k.id))).toBe(true);
  });

  it("never repeats daily kanji across days or after restoring saved history", () => {
    let progress = structuredClone(emptyProgress);
    const visited = new Set<string>();
    for (let day=1;day<=35;day++) {
      const cards = shuffleDeterministic(unseenCards(singles, seenContentIds(progress, starterContent)), `day-${day}`).slice(0,30);
      for (const card of cards) {
        expect(visited.has(card.id)).toBe(false);
        visited.add(card.id);
        progress.review.push(scheduleReview(undefined, card.id, day, "hard"));
      }
      progress = JSON.parse(JSON.stringify(progress));
    }
    expect(visited.size).toBe(979);
    expect(unseenCards(singles, seenContentIds(progress, starterContent))).toHaveLength(0);
  });

  it("does not refill exhausted new-question pools with already seen questions", () => {
    let progress = structuredClone(emptyProgress);
    const visited = new Set<string>();
    for (let day=0;day<30;day++) {
      const questions = selectQuestions(unseenQuestions(starterContent.questions, progress), {count:6,seed:`day-${day}`,categories:["reading"]});
      for (const question of questions) {
        expect(visited.has(question.id)).toBe(false);
        visited.add(question.id);
        progress.answers.push(makeAnswerRecord({ question, selectedAnswer: question.correctAnswer, confidence:"sure", elapsedMs:1000, sessionId:`day-${day}` }));
      }
    }
    expect(selectQuestions(unseenQuestions(starterContent.questions, progress), {count:6,seed:"exhausted",categories:["reading"]})).toHaveLength(0);
    expect(selectQuestions(starterContent.questions, {count:6,seed:"review",categories:["reading"]})).toHaveLength(6);
  });

  it("separates encountered material from learned ratings and supports relearning", () => {
    const card = singles[0];
    const question = starterContent.questions.find(q=>q.relatedContentId===card.id && !q.tags.includes("retired"))!;
    const progress = {...structuredClone(emptyProgress), answers:[makeAnswerRecord({question,selectedAnswer:question.correctAnswer,confidence:"sure",elapsedMs:1000,sessionId:"test"})]};
    expect(learningCoverage(progress,starterContent)[0]).toMatchObject({ learned:0, encountered:1, remaining:979 });
    progress.review = [scheduleReview(undefined,card.id,1,"good")];
    expect(learningCoverage(progress,starterContent)[0]).toMatchObject({ learned:1, encountered:1, remaining:978 });
    progress.review = [scheduleReview(progress.review[0],card.id,2,"again")];
    expect(learningCoverage(progress,starterContent)[0]).toMatchObject({ learned:0, reviewing:1, remaining:979 });
  });

  it("deduplicates alternate card IDs and duplicate question prompts", () => {
    expect(unseenCards([{id:"a",word:"確認",reading:"かくにん"},{id:"b",word:"確認",reading:"かくにん"}],new Set(["a"]))).toEqual([]);
    const q = starterContent.questions.find(q=>!q.tags.includes("retired"))!;
    const duplicate = {...q,id:"duplicate"};
    const progress = {...emptyProgress,answers:[makeAnswerRecord({question:q,selectedAnswer:"",confidence:"guess",elapsedMs:0,sessionId:"old"})]};
    expect(unseenQuestions([q,duplicate],progress)).toEqual([]);
  });
});
