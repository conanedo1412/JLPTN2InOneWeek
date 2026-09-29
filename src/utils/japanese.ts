export const kindLabels = { kanji: "漢字", vocabulary: "語彙", grammar: "文法" };
export const deckLabels = { daily: "今日の範囲", mixed: "総合", due: "復習予定", hard: "難しい問題", random: "無作為" };
export const ratingLabels = { again: "もう一度", hard: "難しい", good: "覚えた", easy: "簡単" };
export const riskLabels = { strong: "安定", moderate: "確認が必要", weak: "要復習", critical: "最優先" };

export function japaneseText(value: string): string {
  return /[A-Za-z]/.test(value) ? "日本語の説明は未登録です。" : value;
}

export function japaneseFormation(value: string): string {
  return value.replaceAll("Vます stem", "動詞のます形の語幹")
    .replaceAll("Vない stem", "動詞のない形から「ない」を除いた形")
    .replaceAll("いA stem", "い形容詞の語幹")
    .replaceAll("V", "動詞").replaceAll("いA", "い形容詞").replaceAll("なA", "な形容詞")
    .replaceAll("N", "名詞").replaceAll("stem", "語幹");
}
