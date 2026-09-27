import type { AnswerRecord, MistakeRecord, Subcategory, WeakArea } from "../../types";

export const subcategoryLabels: Record<Subcategory, string> = {
  "kanji-meaning": "漢字の識別",
  "kanji-reading": "漢字の読み",
  "vocabulary-recognition": "語彙の意味",
  "vocabulary-context": "文脈と語彙",
  "grammar-recognition": "文法の意味",
  "grammar-nuance": "文法の使い分け",
  "sentence-ordering": "文の組み立て",
  "short-reading": "読解"
};

export const allSubcategories = Object.keys(subcategoryLabels) as Subcategory[];

export function accuraciesBySubcategory(records: AnswerRecord[]): Record<Subcategory, number> {
  return Object.fromEntries(
    allSubcategories.map((subcategory) => {
      const scoped = records.filter((r) => r.subcategory === subcategory);
      return [subcategory, scoped.length ? Math.round((scoped.filter((r) => r.correct).length / scoped.length) * 100) : 0];
    })
  ) as Record<Subcategory, number>;
}

/**
 * Weakness score is intentionally explainable:
 * incorrect = 5, correct guess = 3, correct unsure = 1.5, slow answer = +1,
 * repeated miss = +1.5 per extra miss, recently corrected = -2 but not below zero.
 * It does not predict official JLPT points; it only ranks risk areas for cram planning.
 */
export function calculateWeakAreas(records: AnswerRecord[], mistakes: MistakeRecord[]): WeakArea[] {
  const mistakeMap = new Map(mistakes.map((m) => [m.questionId, m]));
  const grouped = new Map<Subcategory, AnswerRecord[]>();
  for (const record of records) {
    grouped.set(record.subcategory, [...(grouped.get(record.subcategory) ?? []), record]);
  }

  return allSubcategories
    .map((subcategory) => {
      const scoped = grouped.get(subcategory) ?? [];
      let score = scoped.length ? 1 : 0;
      const reasons: string[] = [];
      for (const record of scoped) {
        const mistake = mistakeMap.get(record.questionId);
        if (!record.correct) {
          score += 5;
          reasons.push("incorrect answers");
        } else if (record.confidence === "guess") {
          score += 3;
          reasons.push("correct guesses");
        } else if (record.confidence === "unsure") {
          score += 1.5;
          reasons.push("low confidence");
        }
        if (record.elapsedMs > 75_000) {
          score += 1;
          reasons.push("slow answers");
        }
        if (mistake && mistake.timesMissed > 1) score += (mistake.timesMissed - 1) * 1.5;
        if (mistake?.corrected) score = Math.max(0, score - 2);
      }
      const normalized = scoped.length ? score / Math.sqrt(scoped.length) : 0;
      const label: WeakArea["label"] =
        normalized >= 10 ? "critical" : normalized >= 6 ? "weak" : normalized >= 3 ? "moderate" : "strong";
      return {
        subcategory,
        score: Number(normalized.toFixed(2)),
        label,
        reasons: Array.from(new Set(reasons)).slice(0, 3)
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function overallCompletion(completedTasks: string[], totalTasks: number): number {
  if (!totalTasks) return 0;
  return Math.min(100, Math.round((new Set(completedTasks).size / totalTasks) * 100));
}

export function easyMaterialWarning(records: AnswerRecord[], weakAreas: WeakArea[]): string | undefined {
  const vocab = records.filter((r) => r.subcategory === "vocabulary-recognition");
  const vocabAccuracy = vocab.length ? vocab.filter((r) => r.correct).length / vocab.length : 0;
  const topRisk = weakAreas.find((w) => w.label === "critical" || w.label === "weak");
  if (vocab.length >= 8 && vocabAccuracy >= 0.85 && topRisk && topRisk.subcategory !== "vocabulary-recognition") {
    return `You are already scoring well on basic vocabulary. Spend today's remaining time on ${subcategoryLabels[topRisk.subcategory].toLowerCase()}.`;
  }
  return undefined;
}
