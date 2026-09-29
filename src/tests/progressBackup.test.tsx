import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import { createDefaultSetup } from "../features/study-plan/plan";
import { emptyProgress, loadProgress, saveProgress } from "../storage/progressStorage";
import { exportProgress, importProgress } from "../services/importExport";

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false })) });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("portable progress backups", () => {
  it("restores a backup after browser storage has been cleared, at the saved day", async () => {
    const saved = { ...emptyProgress, setup: { ...createDefaultSetup(), activeDay: 9, lastStudyDate: "2026-01-01" }, completedTasks: ["month-9-cards"], review: [{ contentId: "k-001", dueDay: 10, seenCount: 2, lastRating: "good" as const }] };
    const backup = exportProgress(saved);
    expect(importProgress(backup)).toEqual(saved);
    render(<App />);
    fireEvent.change(screen.getByLabelText("学習記録をアップロード"), { target: { files: [new File([backup], "backup.json", { type: "application/json" })] } });
    await waitFor(() => expect(loadProgress().setup?.activeDay).toBe(9));
    expect(loadProgress().review).toEqual(saved.review);
    expect(loadProgress().completedTasks).toEqual(saved.completedTasks);
    expect(screen.getByRole("button", { name: "学習記録をダウンロード" })).toBeTruthy();
  });

  it("rejects malformed uploads and allows cancelling replacement", async () => {
    saveProgress({ ...emptyProgress, setup: createDefaultSetup(), completedTasks: ["keep"] });
    render(<App />);
    const upload = screen.getByLabelText("学習記録をアップロード");
    fireEvent.change(upload, { target: { files: [new File(['{"version":1}'], "bad.json")] } });
    await screen.findByText(/現在の記録は変更していません/);
    expect(loadProgress().completedTasks).toEqual(["keep"]);
    vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.change(upload, { target: { files: [new File([exportProgress({ ...emptyProgress, setup: createDefaultSetup() })], "valid.json")] } });
    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect(loadProgress().completedTasks).toEqual(["keep"]);
  });

  it("downloads the just-completed quiz in the results backup", () => {
    const blobs: Blob[] = [];
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn((blob: Blob) => { blobs.push(blob); return "blob:test"; }) });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    saveProgress({ ...emptyProgress, setup: createDefaultSetup() });
    render(<App />);
    fireEvent.click(within(screen.getByRole("navigation", { name: "主な画面" })).getByRole("button", { name: "問題" }));
    fireEvent.click(screen.getByRole("button", { name: "12" }));
    fireEvent.click(screen.getByRole("button", { name: "提出" }));
    expect(screen.getByRole("heading", { name: "学習結果" })).toBeTruthy();
    expect(loadProgress().answers).toHaveLength(12);
    fireEvent.click(screen.getAllByRole("button", { name: "学習記録をダウンロード" })[1]);
    expect(blobs).toHaveLength(1);
    expect(blobs[0].size).toBe(new Blob([exportProgress(loadProgress())]).size);
  });
});
