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
    { title: "漢字", categories: ["kanji"] },
    { title: "語彙", categories: ["vocabulary"] },
    { title: "文法", categories: ["grammar", "sentence-ordering"] },
    { title: "読解", categories: ["reading"] }
  ].map(skill => {
    const answers = records.filter(a => skill.categories.includes(a.category)).slice(-50);
    return { title: skill.title, count: answers.length, accuracy: answers.length ? Math.round(100 * answers.filter(a => a.correct).length / answers.length) : 0 };
  });
  const mastered = records.filter(a => a.correct && a.confidence === "sure").length;
  const daily = new Set(progress.answers.filter(a => a.selectedAnswer && formatLocalDate(new Date(a.answeredAt)) === today).map(a => a.questionId)).size;
  const history = dailyActivity(progress);
  const completedQuestDays = history.filter(day => day.questions >= 20).length;
  const badges = [
    { title: "最初の一歩", earned: earned.size >= 10, goal: "異なる問題に十問挑戦" },
    { title: "継続の達人", earned: streak >= 3, goal: "三日間連続で学習" },
    { title: "記憶の達人", earned: mastered >= 100, goal: "確信を持って百問正解" },
    { title: "総合の達人", earned: skills.every(s => s.count >= 20 && s.accuracy >= 80), goal: "各分野で異なる二十問以上に挑戦し、正答率八割を達成" }
  ];
  return { xp, level, levelProgress: Math.round(100 * (xp - floor) / (ceiling - floor)), nextLevel: ceiling - xp, streak, skills, mastered, daily, badges, completedQuestDays };
}

export function dailyActivity(progress: AppProgress) {
  const dates = new Map<string, Map<string, AnswerRecord>>();
  for (const answer of progress.answers) {
    if (!answer.selectedAnswer) continue;
    const date = formatLocalDate(new Date(answer.answeredAt));
    const questions = dates.get(date) ?? new Map<string, AnswerRecord>();
    questions.set(answer.questionId, answer);
    dates.set(date, questions);
  }
  return [...dates.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([date, questions]) => ({
    date, questions: questions.size, correct: [...questions.values()].filter(answer => answer.correct).length
  }));
}
