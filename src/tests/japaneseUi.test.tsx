import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import App from "../App";
import { createDefaultSetup } from "../features/study-plan/plan";
import { emptyProgress, saveProgress } from "../storage/progressStorage";

function expectJapanese() {
  expect(document.body.textContent).not.toMatch(/[A-Za-z]/);
  for (const element of document.querySelectorAll("[aria-label], [title]")) {
    expect(`${element.getAttribute("aria-label") ?? ""}${element.getAttribute("title") ?? ""}`).not.toMatch(/[A-Za-z]/);
  }
}
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false })) });
});
afterEach(cleanup);

describe("Japanese-only interface", () => {
  it("has Japanese setup, navigation, all study views, and flashcard answers", () => {
    const setup = render(<App />);
    expectJapanese();
    setup.unmount();
    saveProgress({ ...emptyProgress, setup: createDefaultSetup() });
    render(<App />);
    const navigation = screen.getByRole("navigation", { name: "主な画面" });
    for (const page of ["今日", "単語帳", "問題", "復習", "学習記録", "設定"]) {
      fireEvent.click(within(navigation).getByRole("button", { name: page }));
      expectJapanese();
    }
    fireEvent.click(within(navigation).getByRole("button", { name: "単語帳" }));
    for (const category of ["漢字", "語彙", "文法"]) {
      fireEvent.click(within(screen.getByRole("group", { name: "学習分野" })).getByRole("button", { name: category }));
      fireEvent.click(screen.getByRole("button", { name: "答えを見る" }));
      expectJapanese();
      expect(document.body.textContent).not.toMatch(/ヒント|組み合わせ|連語/);
    }
  });
});
