import { describe, expect, it } from "vitest";
import { starterContent, starterVocabulary } from "../data/content";
import rows from "../data/expandedVocabulary.json";
import { expandedVocabularyQuestions } from "../data/expandedVocabulary";

const kana = (text: string) => text.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0)-0x60));
describe("6000-entry vocabulary bank", () => {
  it("preserves the original vocabulary and adds unique dictionary entries", () => {
    expect(starterContent.vocabulary).toHaveLength(6000);
    expect(starterContent.vocabulary.slice(0, 248)).toEqual(starterVocabulary);
    expect(new Set(starterContent.vocabulary.map(v=>v.id)).size).toBe(6000);
    expect(new Set(rows.map(v=>v.word)).size).toBe(rows.length);
    const originals = new Set(starterVocabulary.map(v=>v.word));
    expect(rows.some(row=>originals.has(row.word))).toBe(false);
    for (const row of rows) {
      expect(row.definition.length).toBeGreaterThan(4);
      expect(`${row.word}${row.reading}${row.definition}${row.pos}`).not.toMatch(/[A-Za-z]/);
      expect(row.readings).toContain(row.reading);
      expect(row.synset).toMatch(/^\d{8}-[nvar]$/);
    }
  });
  it("never offers an alternate dictionary reading as a wrong answer", () => {
    const byId = new Map(rows.map(row=>[row.id,row]));
    expect(expandedVocabularyQuestions.length).toBeGreaterThan(4000);
    for (const q of expandedVocabularyQuestions.filter(q=>q.tags.includes("読み"))) {
      const valid = new Set(byId.get(q.relatedContentId)!.readings.map(kana));
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices.filter(choice=>valid.has(kana(choice)))).toEqual([q.correctAnswer]);
    }
  });
});
