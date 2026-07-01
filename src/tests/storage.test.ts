import { describe, expect, it } from "vitest";
import { emptyProgress, loadProgress, saveProgress } from "../storage/progressStorage";

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
    expect(storage.length).toBe(0);
  });
});
