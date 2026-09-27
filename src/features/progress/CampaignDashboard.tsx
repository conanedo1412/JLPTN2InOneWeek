import type { AppProgress } from "../../types";
import { chapters, monthPlan } from "../study-plan/plan";
import { campaignStats } from "./campaign";

export function Campaign({ progress, onDay }: { progress: AppProgress; onDay: (day: number) => void }) {
  const stats = campaignStats(progress);
  return <section className="campaign" aria-label="Your adventure">
    <div className="adventurer">
      <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" width="72" height="72" />
      <div><p className="eyebrow">{stats.level < 5 ? "Apprentice" : stats.level < 10 ? "Scholar" : "Sage"}</p><h2>Level {stats.level}</h2><span>{stats.xp.toLocaleString()} XP · {stats.nextLevel} to next level</span><progress max="100" value={stats.levelProgress} aria-label="Level progress" /></div>
      <div className="daily-quest"><strong>Daily quest</strong><span>{Math.min(stats.daily, 20)} / 20 questions</span><progress max="20" value={Math.min(stats.daily, 20)} aria-label="Daily quest" /><small>{stats.streak} day streak · {stats.mastered} confident {stats.mastered === 1 ? "answer" : "answers"}</small></div>
    </div>
    <h2>Your 30-day adventure</h2>
    <div className="chapter-map">{chapters.map((chapter, i) => <section key={chapter.title}>
      <h3><span>{String(i + 1).padStart(2, "0")}</span> {chapter.title}</h3>
      <div className="day-nodes">{monthPlan.slice(i * 6, i * 6 + 6).map(day => {
        const complete = day.tasks.every(t => progress.completedTasks.includes(t.id));
        return <button key={day.day} title={`${day.title}${complete ? " (completed)" : ""}`} aria-label={`Day ${day.day}: ${day.title}`} aria-current={progress.setup?.activeDay === day.day ? "step" : undefined} className={`${complete ? "cleared" : ""} ${day.day % 6 === 0 ? "trial" : ""}`} onClick={() => onDay(day.day)}>{complete ? "✓" : day.day}</button>;
      })}</div>
    </section>)}</div>
    <div className="skill-tracks">{stats.skills.map(skill => <div key={skill.title}><strong>{skill.title}</strong><span>{skill.count ? `${skill.accuracy}%` : "Unexplored"}</span><progress max="100" value={skill.accuracy} aria-label={`${skill.title} accuracy`} /><small>{skill.count} unique questions · practice target 80%</small></div>)}</div>
    <div className="badges">{stats.badges.map(badge => <div className={badge.earned ? "earned" : ""} key={badge.title}><strong>{badge.earned ? "◆" : "◇"} {badge.title}</strong><small>{badge.goal}</small></div>)}</div>
    <p className="fineprint">Goal: 90/120 in language knowledge and reading. Practice percentages are not official scaled scores. Listening is outside this course but is required to pass the JLPT. Use unseen official practice material to check readiness.</p>
  </section>;
}
