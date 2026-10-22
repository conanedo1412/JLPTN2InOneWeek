import type { AppProgress, StudyContent } from "../../types";
import { learningCoverage } from "./coverage";

export function LearningCoverage({ progress, content }: { progress: AppProgress; content: StudyContent }) {
  return <section className="coverage" aria-label="習得した教材と残りの数">
    <h2>習得した数・残りの数</h2>
    <p className="fineprint">習得済みは、単語帳で最後に「覚えた」または「簡単」と評価した項目です。問題に正解しただけでは習得に数えません。「もう一度」「難しい」は復習中に戻ります。</p>
    <div className="coverage-grid">{learningCoverage(progress, content).map(group => <div key={group.title}>
      <h3>{group.title}</h3><strong>習得 {group.learned.toLocaleString()} / {group.total.toLocaleString()}{group.unit}</strong>
      <progress max={group.total} value={group.learned} aria-label={`${group.title}の習得数`} />
      <p>残り {group.remaining.toLocaleString()}{group.unit}</p>
      <small>未学習 {group.unseen.toLocaleString()} · 復習中 {group.reviewing.toLocaleString()} · 学習済み {group.encountered.toLocaleString()}</small>
    </div>)}</div>
    <p className="fineprint">漢字は一字ずつ数え、熟語カードは含めません。収録範囲は学習用の目安で、公式の出題語彙一覧ではありません。</p>
  </section>;
}
