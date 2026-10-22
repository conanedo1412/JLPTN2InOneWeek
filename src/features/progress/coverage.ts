import type { AppProgress, StudyContent, QuizQuestion } from "../../types";

export const isSingleKanji = (value: string) => /^\p{Script=Han}$/u.test(value);

export function unseenCards<T extends { id: string; kanji?: string; word?: string; reading?: string; pattern?: string }>(source: T[], seen: Set<string>): T[] {
  const key = (item: T) => item.kanji ?? item.pattern ?? `${item.word}|${item.reading}`;
  const seenKeys = new Set(source.filter(item => seen.has(item.id)).map(key));
  const unique = new Set<string>();
  return source.filter(item => {
    const identity = key(item);
    if (seenKeys.has(identity) || unique.has(identity)) return false;
    unique.add(identity);
    return true;
  });
}

export function seenContentIds(progress: AppProgress, content: StudyContent): Set<string> {
  const seen = new Set(progress.review.filter(r => r.seenCount > 0).map(r => r.contentId));
  const questions = new Map(content.questions.map(q => [q.id, q.relatedContentId]));
  for (const answer of progress.answers) {
    const id = questions.get(answer.questionId);
    if (id) seen.add(id);
  }
  return seen;
}

export function unseenQuestions(questions: QuizQuestion[], progress: AppProgress): QuizQuestion[] {
  const seen = new Set(progress.answers.map(a => a.questionId));
  const prompts = new Set(questions.filter(q => seen.has(q.id)).map(q => q.prompt.trim()));
  const unique = new Set<string>();
  return questions.filter(q => {
    const prompt = q.prompt.trim();
    if (q.tags.includes("retired") || seen.has(q.id) || prompts.has(prompt) || unique.has(prompt)) return false;
    unique.add(prompt);
    return true;
  });
}

export function learningCoverage(progress: AppProgress, content: StudyContent) {
  const seen = seenContentIds(progress, content);
  const ratings = new Map(progress.review.map(r => [r.contentId, r]));
  const groups = [
    { title: "漢字", unit: "字", items: content.kanji.filter(k => isSingleKanji(k.kanji)).map(k => ({ id: k.id, key: k.kanji })) },
    { title: "語彙", unit: "語", items: content.vocabulary.map(v => ({ id: v.id, key: `${v.word}|${v.reading}` })) },
    { title: "文法", unit: "項目", items: content.grammar.map(g => ({ id: g.id, key: g.pattern })) }
  ];
  return groups.map(group => {
    const entries = new Map<string, string[]>();
    for (const item of group.items) entries.set(item.key, [...(entries.get(item.key) ?? []), item.id]);
    let learned = 0, encountered = 0;
    for (const ids of entries.values()) {
      if (ids.some(id => seen.has(id))) encountered++;
      if (ids.some(id => { const rating = ratings.get(id); return rating && rating.seenCount > 0 && ["good", "easy"].includes(rating.lastRating); })) learned++;
    }
    return { title: group.title, unit: group.unit, total: entries.size, learned, encountered, unseen: entries.size - encountered, remaining: entries.size - learned, reviewing: encountered - learned };
  });
}
