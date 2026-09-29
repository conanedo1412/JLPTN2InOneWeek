import type { AppProgress } from "../../types";
import { chapters, monthPlan } from "../study-plan/plan";
import { campaignStats } from "./campaign";

export function Campaign({ progress, onDay }: { progress: AppProgress; onDay: (day: number) => void }) {
  const stats = campaignStats(progress);
  return <section className="campaign" aria-label="学習の冒険">
    <div className="adventurer">
      <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" width="72" height="72" />
      <div><p className="eyebrow">{stats.level < 5 ? "見習い" : stats.level < 10 ? "学び手" : "賢者"}</p><h2>レベル{stats.level}</h2><span>経験値 {stats.xp.toLocaleString()} · 次のレベルまで {stats.nextLevel}</span><progress max="100" value={stats.levelProgress} aria-label="次のレベルまで" /></div>
      <div className="daily-quest"><strong>今日の目標</strong><span>{Math.min(stats.daily, 20)} / 20問</span><progress max="20" value={Math.min(stats.daily, 20)} aria-label="今日の目標" /><small>連続{stats.streak}日 · 確信のある正解{stats.mastered}問</small></div>
    </div>
    <p>これまでの目標達成：{stats.completedQuestDays}日</p>
    <h2>三十日間の学習の道</h2>
    <div className="chapter-map">{chapters.map((chapter, i) => <section key={chapter.title}>
      <h3><span>{String(i + 1).padStart(2, "0")}</span> {chapter.title}</h3>
      <div className="day-nodes">{monthPlan.slice(i * 6, i * 6 + 6).map(day => {
        const complete = day.tasks.every(t => progress.completedTasks.includes(t.id));
        return <button key={day.day} title={`${day.title}${complete ? "（完了）" : ""}`} aria-label={`${day.day}日目：${day.title}`} aria-current={progress.setup?.activeDay === day.day ? "step" : undefined} className={`${complete ? "cleared" : ""} ${day.day % 6 === 0 ? "trial" : ""}`} onClick={() => onDay(day.day)}>{complete ? "✓" : day.day}</button>;
      })}</div>
    </section>)}</div>
    <div className="skill-tracks">{stats.skills.map(skill => <div key={skill.title}><strong>{skill.title}</strong><span>{skill.count ? `${skill.accuracy}%` : "未学習"}</span><progress max="100" value={skill.accuracy} aria-label={`${skill.title}の正答率`} /><small>出題済み{skill.count}問 · 目標正答率80％</small></div>)}</div>
    <div className="badges">{stats.badges.map(badge => <div className={badge.earned ? "earned" : ""} key={badge.title}><strong>{badge.earned ? "◆" : "◇"} {badge.title}</strong><small>{badge.goal}</small></div>)}</div>
    <p className="fineprint">目標は言語知識と読解で120点中90点。練習の正答率は本試験の尺度得点とは異なります。聴解はこの講座の対象外ですが、合格には必要です。初めて解く公式問題でも実力を確認しましょう。</p>
  </section>;
}
