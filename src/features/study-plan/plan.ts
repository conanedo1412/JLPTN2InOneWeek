import type { SetupInfo } from "../../types";
import { addLocalDays, defaultExamDate } from "../../utils/date";

export const chapters = [
  { title: "Foundation", intent: "Map your strengths, establish daily recall, and read for the main idea." },
  { title: "Connections", intent: "Build vocabulary in context and distinguish similar grammar patterns." },
  { title: "Precision", intent: "Infer the author's position, follow references, and repair recurring errors." },
  { title: "Endurance", intent: "Balance accuracy and speed across language knowledge and reading." },
  { title: "Final Trial", intent: "Complete timed practice, examine the evidence, and revisit weak skills." }
];
export interface StudyTask {
  id: string; title: string; minutes: number;
  mode: "diagnostic" | "learn" | "quiz" | "mistakes" | "timed" | "review";
  focus: string;
}
export interface DayPlan { day: number; title: string; intent: string; tasks: StudyTask[] }
const focuses = ["Readings and compounds", "Vocabulary in context", "Grammar distinctions", "Sentence structure", "Reading inference", "Checkpoint"];
export const monthPlan: DayPlan[] = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;
  const chapter = chapters[Math.floor(index / 6)];
  return {
    day, title: `${chapter.title}: ${focuses[index % 6]}`, intent: chapter.intent,
    tasks: [
      { id: `month-${day}-cards`, title: "Recall today's cards", minutes: 20, mode: "learn", focus: "Kanji, vocabulary, grammar" },
      { id: `month-${day}-practice`, title: day === 1 ? "Baseline diagnostic" : day % 6 === 0 ? "Chapter trial" : "Focused practice", minutes: 30, mode: day === 1 ? "diagnostic" : day % 6 === 0 ? "timed" : "quiz", focus: focuses[index % 6] },
      { id: `month-${day}-reading`, title: "Reading expedition", minutes: 25, mode: "quiz", focus: "Main idea, evidence, inference" },
      { id: `month-${day}-repair`, title: "Review and explain your errors", minutes: 15, mode: "mistakes", focus: "Why each distractor is wrong" }
    ]
  };
});
export function createDefaultSetup(): SetupInfo {
  return { examDate: defaultExamDate(), dailyMinutes: 90, activeDay: 1, completedDays: [] };
}
export function studyDates(startDate: string): string[] {
  return Array.from({ length: 30 }, (_, offset) => addLocalDays(startDate, offset));
}
export function getDayPlan(day: number): DayPlan {
  return monthPlan[Math.max(0, Math.min(29, Math.floor(day || 1) - 1))];
}
