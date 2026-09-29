import { describe, expect, it } from "vitest";
import { advanceStudyDay, BACKUP_KEY, emptyProgress, loadProgress, RECOVERY_KEY, saveProgress, STORAGE_KEY } from "../storage/progressStorage";
import { campaignStats } from "../features/progress/campaign";
import { makeAnswerRecord } from "../features/quiz/quizLogic";
import { starterContent } from "../data/content";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

describe("progress persistence", () => {
  it("saves and restores progress", () => {
    const storage = new MemoryStorage();
    saveProgress({ ...emptyProgress, completedTasks: ["d1-diagnostic"] }, storage);
    expect(loadProgress(storage).completedTasks).toEqual(["d1-diagnostic"]);
  });

  it("recovers from corrupted saved data", () => {
    const storage = new MemoryStorage();
    storage.setItem("jlpt-n2-five-day-progress", "{bad");
    expect(loadProgress(storage).answers).toEqual([]);
    expect(storage.getItem(STORAGE_KEY)).toBe("{bad");
    saveProgress(emptyProgress, storage);
    expect(storage.getItem(RECOVERY_KEY)).toBe("{bad");
  });

  it("restores the previous valid save when the primary copy is damaged", () => {
    const storage = new MemoryStorage();
    saveProgress({ ...emptyProgress, completedTasks: ["month-1-cards"] }, storage);
    saveProgress({ ...emptyProgress, completedTasks: ["month-1-cards", "month-1-reading"] }, storage);
    storage.setItem(STORAGE_KEY, "{broken");
    expect(loadProgress(storage).completedTasks).toEqual(["month-1-cards"]);
    expect(storage.getItem(BACKUP_KEY)).toBeTruthy();
  });

  it("reports a blocked write without throwing or clearing existing data", () => {
    const storage = new MemoryStorage();
    saveProgress({ ...emptyProgress, completedTasks: ["retained"] }, storage);
    const original = storage.getItem(STORAGE_KEY);
    storage.setItem = () => { throw new Error("quota"); };
    expect(saveProgress(emptyProgress, storage)).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(original);
  });

  it("advances a legacy user's day but retains all records and XP", () => {
    const answers = starterContent.questions.slice(0, 20).map(question => makeAnswerRecord({ question, selectedAnswer: question.correctAnswer, confidence: "sure", elapsedMs: 10000, sessionId: "yesterday", now: "2026-09-28T12:00:00+09:00" }));
    const legacy = { ...emptyProgress, setup: { examDate: "2026-10-28", activeDay: 1, dailyMinutes: 90 as const, completedDays: [1] }, answers, completedTasks: ["month-1-cards"], review: [{ contentId: "k-001", dueDay: 2, lastRating: "good" as const, seenCount: 1 }] };
    const tomorrow = advanceStudyDay(legacy, "2026-09-29");
    expect(tomorrow.setup?.activeDay).toBe(2);
    expect(tomorrow.answers).toEqual(legacy.answers);
    expect(tomorrow.review).toEqual(legacy.review);
    expect(tomorrow.completedTasks).toEqual(legacy.completedTasks);
    const stats = campaignStats(tomorrow, "2026-09-29");
    expect(stats.xp).toBe(campaignStats(legacy, "2026-09-28").xp);
    expect(stats.daily).toBe(0);
    expect(stats.completedQuestDays).toBe(1);
    expect(advanceStudyDay(tomorrow, "2026-09-29")).toBe(tomorrow);
    const afterCourse = advanceStudyDay(tomorrow, "2026-12-01");
    expect(afterCourse.setup?.activeDay).toBe(30);
    expect(afterCourse.answers).toEqual(answers);
  });
});
