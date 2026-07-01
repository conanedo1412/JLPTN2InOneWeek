import type { AppProgress } from "../types";

export const STORAGE_KEY = "jlpt-n2-five-day-progress";
export const STORAGE_VERSION = 1;

export const emptyProgress: AppProgress = {
  version: STORAGE_VERSION,
  answers: [],
  mistakes: [],
  review: [],
  completedTasks: [],
  progressHistory: [],
  theme: "system"
};

export function sanitizeProgress(value: unknown): AppProgress {
  if (!value || typeof value !== "object") return { ...emptyProgress };
  const candidate = value as Partial<AppProgress>;
  if (candidate.version !== STORAGE_VERSION) return { ...emptyProgress };
  return {
    ...emptyProgress,
    ...candidate,
    answers: Array.isArray(candidate.answers) ? candidate.answers : [],
    mistakes: Array.isArray(candidate.mistakes) ? candidate.mistakes : [],
    review: Array.isArray(candidate.review) ? candidate.review : [],
    completedTasks: Array.isArray(candidate.completedTasks) ? candidate.completedTasks : [],
    progressHistory: Array.isArray(candidate.progressHistory) ? candidate.progressHistory : [],
    theme: candidate.theme === "dark" || candidate.theme === "light" || candidate.theme === "system" ? candidate.theme : "system"
  };
}

export function loadProgress(storage: Storage = localStorage): AppProgress {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyProgress };
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    storage.removeItem(STORAGE_KEY);
    return { ...emptyProgress };
  }
}

export function saveProgress(progress: AppProgress, storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeProgress(progress)));
}
