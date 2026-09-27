import { describe, expect, it } from "vitest";
import { scheduleReview } from "../features/learn/scheduler";
import { createDefaultSetup, studyDates } from "../features/study-plan/plan";

describe("month schedule and review intervals", () => {
  it("schedules reviews beyond the former five-day window", () => {
    const state = scheduleReview(undefined, "g-001", 5, "easy");
    expect(state.dueDay).toBe(7);
  });

  it("schedules again for the same study day", () => {
    expect(scheduleReview(undefined, "v-001", 2, "again").dueDay).toBe(2);
  });

  it("creates thirty local study dates across month boundaries", () => {
    expect(studyDates("2026-06-28")).toHaveLength(30);
    expect(studyDates("2026-06-28")[29]).toBe("2026-07-27");
  });

  it("defaults setup to day one and 90 minutes", () => {
    const setup = createDefaultSetup();
    expect(setup.activeDay).toBe(1);
    expect(setup.dailyMinutes).toBe(90);
  });
});
