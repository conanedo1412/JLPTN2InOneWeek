import type { AppProgress, AnswerRecord } from "../../types";
import { addLocalDays, formatLocalDate, todayLocal } from "../../utils/date";

export function campaignStats(progress: AppProgress, today = todayLocal()) {
  const latest = new Map<string, AnswerRecord>();
  const earned = new Map<string, number>();
  for (const answer of progress.answers) {
    latest.delete(answer.questionId);
    latest.set(answer.questionId, answer);
    if (!answer.selectedAnswer) continue;
    earned.set(answer.questionId, Math.max(earned.get(answer.questionId) ?? 0, answer.correct ? answer.confidence === "sure" ? 20 : 12 : 3));
  }
  const xp = [...earned.values()].reduce((sum, value) => sum + value, 0) + new Set(progress.review.map(r => r.contentId)).size * 5;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const floor = 100 * (level - 1) ** 2;
  const ceiling = 100 * level ** 2;
  const days = new Set(progress.answers.filter(a => a.selectedAnswer).map(a => formatLocalDate(new Date(a.answeredAt))));
  let cursor = days.has(today) ? today : addLocalDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) { streak++; cursor = addLocalDays(cursor, -1); }
  const records = [...latest.values()];
  const skills = [
    { title: "Kanji", categories: ["kanji"] },
    { title: "Vocabulary", categories: ["vocabulary"] },
    { title: "Grammar", categories: ["grammar", "sentence-ordering"] },
    { title: "Reading", categories: ["reading"] }
  ].map(skill => {
    const answers = records.filter(a => skill.categories.includes(a.category)).slice(-50);
    return { title: skill.title, count: answers.length, accuracy: answers.length ? Math.round(100 * answers.filter(a => a.correct).length / answers.length) : 0 };
  });
  const mastered = records.filter(a => a.correct && a.confidence === "sure").length;
  const daily = new Set(progress.answers.filter(a => a.selectedAnswer && formatLocalDate(new Date(a.answeredAt)) === today).map(a => a.questionId)).size;
  const badges = [
    { title: "First Steps", earned: earned.size >= 10, goal: "Attempt 10 different questions" },
    { title: "Steady Scholar", earned: streak >= 3, goal: "Study on 3 consecutive days" },
    { title: "Recall Adept", earned: mastered >= 100, goal: "100 confident correct answers" },
    { title: "Balanced Scholar", earned: skills.every(s => s.count >= 20 && s.accuracy >= 80), goal: "80% in each skill across 20 unique questions" }
  ];
  return { xp, level, levelProgress: Math.round(100 * (xp - floor) / (ceiling - floor)), nextLevel: ceiling - xp, streak, skills, mastered, daily, badges };
}
