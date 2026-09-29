import type { SetupInfo } from "../../types";
import { addLocalDays, defaultExamDate, todayLocal } from "../../utils/date";

export const chapters = [
  { title: "基礎の章", intent: "得意・不得意を確認し、語句の想起と文章の要点把握に取り組む。" },
  { title: "理解の章", intent: "文脈の中で語彙を覚え、似た文法表現を使い分ける。" },
  { title: "精度の章", intent: "筆者の立場と指示語を読み取り、繰り返す誤りを克服する。" },
  { title: "実践の章", intent: "言語知識と読解で、正確さと速さの両立を目指す。" },
  { title: "最終の章", intent: "時間を計って練習し、判断の根拠を確認して弱点を復習する。" }
];
export interface StudyTask {
  id: string; title: string; minutes: number;
  mode: "diagnostic" | "learn" | "quiz" | "mistakes" | "timed" | "review";
  focus: string;
}
export interface DayPlan { day: number; title: string; intent: string; tasks: StudyTask[] }
const focuses = ["漢字の読みと熟語", "文脈と語彙", "文法の使い分け", "文の組み立て", "読解と推論", "章末確認"];
export const monthPlan: DayPlan[] = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;
  const chapter = chapters[Math.floor(index / 6)];
  return {
    day, title: `${chapter.title}: ${focuses[index % 6]}`, intent: chapter.intent,
    tasks: [
      { id: `month-${day}-cards`, title: "今日の単語帳", minutes: 20, mode: "learn", focus: "漢字・語彙・文法" },
      { id: `month-${day}-practice`, title: day === 1 ? "初回の実力診断" : day % 6 === 0 ? "章末試験" : "分野別練習", minutes: 30, mode: day === 1 ? "diagnostic" : day % 6 === 0 ? "timed" : "quiz", focus: focuses[index % 6] },
      { id: `month-${day}-reading`, title: "読解への挑戦", minutes: 25, mode: "quiz", focus: "要点・根拠・推論" },
      { id: `month-${day}-repair`, title: "誤答の復習と理由の確認", minutes: 15, mode: "mistakes", focus: "各選択肢が誤りである理由" }
    ]
  };
});
export function createDefaultSetup(): SetupInfo {
  return { examDate: defaultExamDate(), dailyMinutes: 90, activeDay: 1, completedDays: [], lastStudyDate: todayLocal() };
}
export function studyDates(startDate: string): string[] {
  return Array.from({ length: 30 }, (_, offset) => addLocalDays(startDate, offset));
}
export function getDayPlan(day: number): DayPlan {
  return monthPlan[Math.max(0, Math.min(29, Math.floor(day || 1) - 1))];
}
