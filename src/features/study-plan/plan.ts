import type { SetupInfo } from "../../types";
import { addLocalDays, defaultExamDate } from "../../utils/date";

export interface StudyTask {
  id: string;
  title: string;
  minutes: number;
  mode: "diagnostic" | "learn" | "quiz" | "mistakes" | "timed" | "review";
  focus: string;
}

export interface DayPlan {
  day: 1 | 2 | 3 | 4 | 5;
  title: string;
  intent: string;
  tasks: StudyTask[];
}

export const fiveDayPlan: DayPlan[] = [
  {
    day: 1,
    title: "Diagnostic and weak-point discovery",
    intent: "Find the exact small weaknesses costing the final points.",
    tasks: [
      { id: "d1-diagnostic", title: "Mixed diagnostic", minutes: 45, mode: "diagnostic", focus: "All categories" },
      { id: "d1-review", title: "Review guessed and missed answers", minutes: 25, mode: "mistakes", focus: "Confidence and errors" },
      { id: "d1-plan", title: "Build weak-area plan", minutes: 20, mode: "review", focus: "Risk categories" }
    ]
  },
  {
    day: 2,
    title: "High-yield vocabulary and kanji",
    intent: "Repair confusions in readings, compounds, and formal written vocabulary.",
    tasks: [
      { id: "d2-targeted", title: "Targeted review", minutes: 15, mode: "learn", focus: "Due mistakes" },
      { id: "d2-kanji", title: "Kanji reading quiz", minutes: 20, mode: "quiz", focus: "Kanji readings" },
      { id: "d2-vocab", title: "Vocabulary in context", minutes: 20, mode: "quiz", focus: "Contextual vocabulary" },
      { id: "d2-mistakes", title: "Mistake review", minutes: 15, mode: "mistakes", focus: "Confused words" },
      { id: "d2-mixed", title: "Timed mixed set", minutes: 20, mode: "timed", focus: "Kanji and vocabulary" }
    ]
  },
  {
    day: 3,
    title: "Grammar distinctions and traps",
    intent: "Focus on nuance, formation, and sentence ordering rather than long explanations.",
    tasks: [
      { id: "d3-learn", title: "Grammar flashcards", minutes: 20, mode: "learn", focus: "Similar patterns" },
      { id: "d3-nuance", title: "Grammar nuance quiz", minutes: 25, mode: "quiz", focus: "Cause, contrast, limitation" },
      { id: "d3-order", title: "Sentence ordering", minutes: 20, mode: "quiz", focus: "Fixed grammar chunks" },
      { id: "d3-recovery", title: "Recovery review", minutes: 25, mode: "mistakes", focus: "Repeated grammar mistakes" }
    ]
  },
  {
    day: 4,
    title: "Mixed timed practice and error correction",
    intent: "Practice exam tempo and turn slow, guessed, or careless answers into recovery work.",
    tasks: [
      { id: "d4-timed", title: "Timed mixed practice", minutes: 45, mode: "timed", focus: "Exam-like mixed set" },
      { id: "d4-analysis", title: "Time and mistake analysis", minutes: 15, mode: "review", focus: "Slow correct answers" },
      { id: "d4-recovery", title: "Recovery session", minutes: 30, mode: "mistakes", focus: "Incorrect, guessed, slow" }
    ]
  },
  {
    day: 5,
    title: "Final simulation and targeted review",
    intent: "Confirm readiness, review personal errors, and avoid new overload.",
    tasks: [
      { id: "d5-final", title: "Final timed mixed test", minutes: 45, mode: "timed", focus: "Final simulation" },
      { id: "d5-weak", title: "Last-chance weak-area review", minutes: 25, mode: "mistakes", focus: "Personal errors" },
      { id: "d5-strategy", title: "Exam strategy checklist", minutes: 20, mode: "review", focus: "Time and elimination" }
    ]
  }
];

export function createDefaultSetup(): SetupInfo {
  return {
    examDate: defaultExamDate(),
    dailyMinutes: 90,
    activeDay: 1,
    completedDays: []
  };
}

export function studyDates(startDate: string): string[] {
  return [0, 1, 2, 3, 4].map((offset) => addLocalDays(startDate, offset));
}

export function getDayPlan(day: number): DayPlan {
  return fiveDayPlan[Math.max(0, Math.min(4, day - 1))];
}
