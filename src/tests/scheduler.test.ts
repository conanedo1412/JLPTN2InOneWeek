import { describe, expect, it } from "vitest";
import { scheduleReview } from "../features/learn/scheduler";
import { createDefaultSetup, studyDates } from "../features/study-plan/plan";

describe("five-day schedule and review intervals", () => {
  it("keeps easy review inside the five-day preparation window", () => {
    const state = scheduleReview(undefined, "g-001", 5, "easy");
    expect(state.dueDay).toBe(5);
  });

  it("schedules again for the same study day", () => {
    expect(scheduleReview(undefined, "v-001", 2, "again").dueDay).toBe(2);
  });

  it("creates five local study dates", () => {
    expect(studyDates("2026-06-28")).toEqual(["2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02"]);
  });

  it("defaults setup to day one and 90 minutes", () => {
    const setup = createDefaultSetup();
    expect(setup.activeDay).toBe(1);
    expect(setup.dailyMinutes).toBe(90);
  });
});
