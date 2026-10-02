import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import App from "../App";
import { createDefaultSetup, getDayPlan, taskDetails } from "../features/study-plan/plan";
import { emptyProgress, loadProgress, saveProgress } from "../storage/progressStorage";

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false })) });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const setup = (day = 1, completedTasks: string[] = []) => saveProgress({ ...emptyProgress, setup: { ...createDefaultSetup(), activeDay: day, dailyMinutes: 30 }, completedTasks });

describe("guided daily workflow", () => {
  it("starts with a bounded card deck, saves completion, and offers the next step", () => {
    setup();
    render(<App />);
    expect(screen.getByText("漢字の単語帳を10枚復習")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "最初の課題へ：今日の単語帳" }));
    expect(screen.getByText("1 / 10")).toBeTruthy();
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByRole("button", { name: "答えを見る" }));
      fireEvent.click(screen.getByRole("button", { name: "覚えた" }));
    }
    expect(loadProgress().completedTasks).toContain("month-1-cards");
    expect(loadProgress().review).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "今日の課題に戻る" }));
    expect(screen.getByRole("button", { name: "次の課題へ：初回の実力診断" })).toBeTruthy();
  });

  it("restores the next unfinished task and refuses to complete an unanswered quiz", () => {
    setup(2, ["month-2-cards"]);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "次の課題へ：分野別練習" }));
    expect((screen.getByRole("combobox", { name: "出題形式" }) as HTMLSelectElement).value).toBe("vocab");
    fireEvent.click(screen.getByRole("button", { name: "20" }));
    fireEvent.click(screen.getByRole("button", { name: "提出" }));
    expect(loadProgress().completedTasks).toEqual(["month-2-cards"]);
  });

  it("automatically completes submitted reading practice and permits an empty error review", () => {
    setup(2, ["month-2-cards", "month-2-practice"]);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "次の課題へ：読解への挑戦" }));
    for (let i = 0; i < 6; i++) {
      const question = screen.getByRole("article");
      const choices = within(question).getAllByRole("button");
      fireEvent.click(choices[1]);
      fireEvent.click(screen.getByRole("button", { name: i < 5 ? "次へ" : "提出" }));
    }
    expect(loadProgress().completedTasks).toContain("month-2-reading");
    fireEvent.click(screen.getByRole("button", { name: "今日の課題に戻る" }));
    fireEvent.click(screen.getByRole("button", { name: "次の課題へ：誤答の復習と理由の確認" }));
    fireEvent.click(screen.getByRole("button", { name: "復習を完了" }));
    expect(screen.getByRole("heading", { name: "今日の四つの課題を達成しました" })).toBeTruthy();
    expect(loadProgress().completedTasks).toHaveLength(4);
  });

  it("gives each day explicit targets and shows the actual checkpoint time", () => {
    for (let day = 1; day <= 30; day++) {
      const plan = getDayPlan(day);
      expect(plan.tasks).toHaveLength(4);
      for (const task of plan.tasks) {
        const details = taskDetails(task, day, 90);
        expect(details.goal.length).toBeGreaterThan(5);
        expect(details.detail.length).toBeGreaterThan(10);
      }
      if (day % 6 === 0) expect(taskDetails(plan.tasks[1], day, 30).minutes).toBe(60);
    }
  });
});
