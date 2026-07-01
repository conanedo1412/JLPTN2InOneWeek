import { describe, expect, it } from "vitest";
import { starterContent } from "../data/content";
import { importProgress, parseVocabularyCsv, validateContent } from "../services/importExport";

describe("content and progress import validation", () => {
  it("validates starter content", () => {
    expect(validateContent(starterContent)).toEqual([]);
    expect(starterContent.questions.length).toBeGreaterThanOrEqual(150);
  });

  it("rejects broken question references", () => {
    const issues = validateContent({
      kanji: starterContent.kanji.slice(0, 1),
      questions: [{ ...starterContent.questions[0], relatedContentId: "missing" }]
    });
    expect(issues.some((issue) => issue.message.includes("references a content item"))).toBe(true);
  });

  it("parses simple vocabulary CSV", () => {
    const rows = parseVocabularyCsv("word,reading,meaning\n確認,かくにん,confirmation");
    expect(rows[0].word).toBe("確認");
  });

  it("rejects unsupported progress versions", () => {
    expect(() => importProgress(JSON.stringify({ version: 99 }))).toThrow("unsupported");
  });
});
