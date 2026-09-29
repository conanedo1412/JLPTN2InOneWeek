import type { AppProgress } from "../types";
import { daysBetweenLocal, formatLocalDate, todayLocal } from "../utils/date";

export const STORAGE_KEY = "jlpt-n2-five-day-progress";
export const STORAGE_VERSION = 1;
export const BACKUP_KEY = `${STORAGE_KEY}-backup`;
export const RECOVERY_KEY = `${STORAGE_KEY}-recovery`;

export function advanceStudyDay(progress: AppProgress, today = todayLocal()): AppProgress {
  if (!progress.setup) return progress;
  const setup = progress.setup;
  const dates = [
    ...progress.answers.map(answer => formatLocalDate(new Date(answer.answeredAt))),
    ...progress.progressHistory.map(snapshot => snapshot.date),
    ...progress.review.map(review => review.reviewedOn ?? "")
  ].filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today).sort();
  const previous = setup.lastStudyDate ?? dates.at(-1) ?? today;
  if (previous >= today && setup.lastStudyDate) return progress;
  const elapsed = Math.max(0, daysBetweenLocal(previous, today));
  return { ...progress, setup: { ...setup, activeDay: Math.min(30, Math.max(1, setup.activeDay) + elapsed), lastStudyDate: today } };
}

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

export function loadProgress(storage?: Storage): AppProgress {
  try {
    storage ??= localStorage;
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      try { return advanceStudyDay(sanitizeProgress(JSON.parse(raw))); } catch { /* Try the independent backup. */ }
    }
    const backup = storage.getItem(BACKUP_KEY);
    return backup ? advanceStudyDay(sanitizeProgress(JSON.parse(backup))) : { ...emptyProgress };
  } catch {
    return { ...emptyProgress };
  }
}

export function saveProgress(progress: AppProgress, storage?: Storage): boolean {
  try {
    storage ??= localStorage;
    const previous = storage.getItem(STORAGE_KEY);
    const serialized = JSON.stringify(sanitizeProgress(progress));
    if (previous === serialized) return true;
    if (previous) {
      let parsed: Partial<AppProgress> | undefined;
      try { parsed = JSON.parse(previous); } catch { /* Preserve unreadable data before replacement. */ }
      if (parsed && parsed.version !== STORAGE_VERSION) return false;
      if (!parsed) storage.setItem(RECOVERY_KEY, previous);
      else storage.setItem(BACKUP_KEY, previous);
    }
    storage.setItem(STORAGE_KEY, serialized);
    if (!storage.getItem(BACKUP_KEY)) storage.setItem(BACKUP_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}
