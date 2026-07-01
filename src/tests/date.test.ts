import { describe, expect, it } from "vitest";
import { addLocalDays, daysBetweenLocal, parseLocalDate } from "../utils/date";

describe("local date handling", () => {
  it("parses YYYY-MM-DD as a local calendar date", () => {
    const date = parseLocalDate("2026-07-05");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(5);
  });

  it("adds days without UTC date drift", () => {
    expect(addLocalDays("2026-06-28", 7)).toBe("2026-07-05");
  });

  it("calculates local day differences", () => {
    expect(daysBetweenLocal("2026-06-28", "2026-07-05")).toBe(7);
  });
});
