import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { starterContent } from "./data/content";
import { dueReviewIds, scheduleReview } from "./features/learn/scheduler";
import { updateMistakes } from "./features/mistakes/mistakeLogic";
import { balancedPractice, makeAnswerRecord, selectQuestions } from "./features/quiz/quizLogic";
import { Campaign } from "./features/progress/CampaignDashboard";
import { ProgressBackup, ProgressDownload } from "./features/progress/ProgressBackup";
import { campaignStats, dailyActivity } from "./features/progress/campaign";
import { accuraciesBySubcategory, calculateWeakAreas, easyMaterialWarning, overallCompletion, subcategoryLabels } from "./features/progress/scoring";
import { chapters, createDefaultSetup, monthPlan, getDayPlan, taskDetails, type StudyTask } from "./features/study-plan/plan";
import { advanceStudyDay, emptyProgress, loadProgress, saveProgress, STORAGE_KEY } from "./storage/progressStorage";
import { parseContentJson, parseVocabularyCsv, validateContent } from "./services/importExport";
import type { AppProgress, Confidence, GrammarItem, QuizQuestion, Rating, StudyCategory, StudyContent, Subcategory, VocabularyItem } from "./types";
import { daysBetweenLocal, todayLocal } from "./utils/date";
import { shuffleDeterministic } from "./utils/random";
import { deckLabels, japaneseFormation, japaneseText, kindLabels, ratingLabels, riskLabels } from "./utils/japanese";

type Page = "today" | "learn" | "quiz" | "mistakes" | "progress" | "settings";
type QuizPreset = "diagnostic" | "quick" | "weak" | "timed" | "kanji" | "vocab" | "grammar" | "reading" | "final";
type FlashcardItem = GrammarItem | VocabularyItem | StudyContent["kanji"][number];

const navItems: { page: Page; label: string }[] = [
  { page: "today", label: "今日" },
  { page: "learn", label: "単語帳" },
  { page: "quiz", label: "問題" },
  { page: "mistakes", label: "復習" },
  { page: "progress", label: "学習記録" },
  { page: "settings", label: "設定" }
];

function mergeContent(progress: AppProgress): StudyContent {
  return {
    kanji: [...starterContent.kanji, ...(progress.importedContent?.kanji ?? [])],
    vocabulary: [...starterContent.vocabulary, ...(progress.importedContent?.vocabulary ?? [])],
    grammar: [...starterContent.grammar, ...(progress.importedContent?.grammar ?? [])],
    questions: [...starterContent.questions, ...(progress.importedContent?.questions ?? [])]
  };
}

function usePersistentProgress() {
  const [progress, setProgress] = useState<AppProgress>(() => loadProgress());
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef(progress);
  latest.current = progress;
  useEffect(() => {
    setSaveFailed(!saveProgress(progress));
  }, [progress]);
  useEffect(() => {
    const advance = () => setProgress(current => advanceStudyDay(current));
    const flush = () => { saveProgress(latest.current); };
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) setProgress(loadProgress());
    };
    const interval = window.setInterval(advance, 30_000);
    window.addEventListener("focus", advance);
    window.addEventListener("pagehide", flush);
    window.addEventListener("storage", sync);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", advance); window.removeEventListener("pagehide", flush); window.removeEventListener("storage", sync); };
  }, []);
  return [progress, setProgress, saveFailed] as const;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }
  render() {
    if (this.state.failed) {
      return (
        <main className="shell narrow">
          <section className="panel">
            <h1>画面を表示できませんでした</h1>
            <p>保存済みの学習記録を読み込むには、再読み込みしてください。</p>
            <button onClick={() => window.location.reload()}>再読み込み</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [progress, setProgress, saveFailed] = usePersistentProgress();
  const [page, setPage] = useState<Page>("today");
  const [quizPreset, setQuizPreset] = useState<QuizPreset>("quick");
  const [activeTask, setActiveTask] = useState<{ task: StudyTask; day: number } | null>(null);
  const [toast, setToast] = useState("");
  const [restoreRevision, setRestoreRevision] = useState(0);
  const restoreProgress = (restored: AppProgress) => {
    setActiveTask(null);
    setProgress(restored);
    setRestoreRevision(value => value + 1);
    setPage("today");
    setToast("学習記録を復元しました。");
  };
  const content = useMemo(() => mergeContent(progress), [progress]);
  const setup = progress.setup;
  const level = campaignStats(progress).level;
  const previousLevel = useRef(level);
  useEffect(() => {
    if (level > previousLevel.current) setToast(`レベルアップ！レベル${level}に到達しました。`);
    previousLevel.current = level;
  }, [level]);

  useEffect(() => {
    const update = () => setToast("更新版を利用できます。");
    const offline = () => setToast("オフライン学習の準備ができました。");
    window.addEventListener("pwa-update-ready", update);
    window.addEventListener("pwa-offline-ready", offline);
    return () => {
      window.removeEventListener("pwa-update-ready", update);
      window.removeEventListener("pwa-offline-ready", offline);
    };
  }, []);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = progress.theme === "system" ? (prefersDark ? "dark" : "light") : progress.theme;
    document.documentElement.dataset.theme = theme;
  }, [progress.theme]);

  const weakAreas = useMemo(() => calculateWeakAreas(progress.answers, progress.mistakes), [progress.answers, progress.mistakes]);
  const accuracies = useMemo(() => accuraciesBySubcategory(progress.answers), [progress.answers]);
  const totalTasks = monthPlan.reduce((sum, day) => sum + day.tasks.length, 0);
  const completion = overallCompletion(progress.completedTasks.filter(id => id.startsWith("month-")), totalTasks);

  if (!setup) {
    return (
      <ErrorBoundary>
        {saveFailed && <p role="alert" className="notice">学習記録を保存できません。ブラウザーの保存設定と空き容量を確認してください。</p>}
        <SetupPage onComplete={(nextSetup) => setProgress({ ...progress, setup: nextSetup })} backup={<ProgressBackup progress={progress} onRestore={restoreProgress} />} />
      </ErrorBoundary>
    );
  }

  const updateProgress = (recipe: (current: AppProgress) => AppProgress) => setProgress((current) => recipe(current));

  const startQuiz = (preset: QuizPreset) => {
    setActiveTask(null);
    setQuizPreset(preset);
    setPage("quiz");
  };

  const startTask = (task: StudyTask) => {
    setActiveTask({ task, day: setup.activeDay });
    if (task.mode === "learn") setPage("learn");
    else if (task.mode === "mistakes") setPage("mistakes");
    else { setQuizPreset(taskDetails(task, setup.activeDay, setup.dailyMinutes).preset); setPage("quiz"); }
  };
  const finishTask = () => {
    if (activeTask) updateProgress(current => ({ ...current, completedTasks: [...new Set([...current.completedTasks, activeTask.task.id])] }));
    setActiveTask(null);
    setPage("today");
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">二級</span>
            <div>
              <strong>日本語二級の冒険</strong>
              <span>三十日間の学習</span>
            </div>
          </div>
          <nav aria-label="主な画面">
            {navItems.map((item) => (
              <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => { setActiveTask(null); setPage(item.page); }}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="content" id="main" key={restoreRevision}>
          <ProgressBackup progress={progress} onRestore={restoreProgress} />
          {activeTask && page !== "today" && <section className="task-guide" aria-label="取り組み中の課題">
            <strong>{activeTask.day}日目 · {activeTask.task.title}{progress.completedTasks.includes(activeTask.task.id) ? "（達成）" : ""}</strong>
            <p>{taskDetails(activeTask.task, activeTask.day, setup.dailyMinutes).goal}</p>
            <p>{taskDetails(activeTask.task, activeTask.day, setup.dailyMinutes).detail}</p>
            <div className="action-row">
              <button onClick={() => { setPage("today"); setActiveTask(null); }}>今日の課題に戻る</button>
              {activeTask.task.mode === "mistakes" && page === "mistakes" && <button className="primary" onClick={finishTask}>復習を完了</button>}
            </div>
          </section>}
          {saveFailed && <p role="alert" className="notice">学習記録を保存できませんでした。設定から記録を書き出し、ブラウザーの保存設定と空き容量を確認してください。</p>}
          {page === "today" && (
            <TodayPage
              progress={progress}
              content={content}
              weakAreas={weakAreas}
              accuracies={accuracies}
              completion={completion}
              onStartQuiz={startQuiz}
              onStartTask={startTask}
              onTaskToggle={(taskId) =>
                updateProgress((current) => ({
                  ...current,
                  completedTasks: current.completedTasks.includes(taskId)
                    ? current.completedTasks.filter((id) => id !== taskId)
                    : [...current.completedTasks, taskId]
                }))
              }
              onSetupChange={(setupPatch) =>
                updateProgress((current) => ({
                  ...current,
                  setup: current.setup ? { ...current.setup, ...setupPatch } : setup
                }))
              }
            />
          )}
          {page === "learn" && <LearnPage key={activeTask?.task.id ?? "free"} progress={progress} content={content} onProgress={updateProgress} guide={activeTask?.task.mode === "learn" ? activeTask : undefined} />}
          {page === "quiz" && (
            <QuizPage
              key={activeTask?.task.id ?? "free"}
              preset={quizPreset}
              progress={progress}
              content={content}
              weakAreas={weakAreas}
              onPreset={preset => { setActiveTask(null); setQuizPreset(preset); }}
              onComplete={(answers) => {
                updateProgress((current) => {
                  const nextAnswers = [...current.answers, ...answers];
                  const nextMistakes = updateMistakes(current.mistakes, answers, content.questions);
                  return {
                    ...current,
                    completedTasks: activeTask && !["learn", "mistakes"].includes(activeTask.task.mode) && answers.length > 0 && answers.every(answer => answer.selectedAnswer) ? [...new Set([...current.completedTasks, activeTask.task.id])] : current.completedTasks,
                    answers: nextAnswers,
                    mistakes: nextMistakes,
                    progressHistory: [
                      ...current.progressHistory.filter(snapshot => snapshot.date !== todayLocal()),
                      {
                        date: todayLocal(),
                        overallCompletion: completion,
                        accuracies: accuraciesBySubcategory(nextAnswers)
                      }
                    ]
                  };
                });
              }}
            />
          )}
          {page === "mistakes" && <MistakesPage progress={progress} content={content} onStartQuiz={startQuiz} />}
          {page === "progress" && <ProgressPage progress={progress} weakAreas={weakAreas} accuracies={accuracies} />}
          {page === "settings" && <SettingsPage progress={progress} content={content} onProgress={setProgress} />}
        </main>

        <nav className="bottom-nav" aria-label="画面の切り替え">
          {navItems.map((item) => (
            <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => { setActiveTask(null); setPage(item.page); }}>
              {item.label}
            </button>
          ))}
        </nav>

        {toast && (
          <div className="toast" role="status">
            <span>{toast}</span>
            {toast.includes("更新版") ? <><button onClick={() => window.dispatchEvent(new Event("pwa-apply-update"))}>更新する</button><button onClick={() => setToast("")}>後で</button></> : <button onClick={() => setToast("")}>閉じる</button>}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function SetupPage({ onComplete, backup }: { onComplete: (setup: NonNullable<AppProgress["setup"]>) => void; backup: ReactNode }) {
  const defaults = createDefaultSetup();
  const [examDate, setExamDate] = useState(defaults.examDate);
  const [dailyMinutes, setDailyMinutes] = useState<30 | 60 | 90 | 120>(90);
  return (
    <main className="setup-shell">
      {backup}
      <section className="setup-hero">
        <div>
          <p className="eyebrow">日本語能力試験二級 · 三十日間</p>
          <h1>日本語二級の冒険</h1>
          <p>
            漢字・語彙・文法・読解を、一日ずつ積み重ねて身につけましょう。
          </p>
        </div>
      </section>
      <section className="setup-grid">
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            onComplete({ examDate, dailyMinutes, activeDay: 1, completedDays: [], lastStudyDate: todayLocal() });
          }}
        >
          <h2>初期設定</h2>
          <label>
            試験日
            <input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} />
          </label>
          <fieldset>
            <legend>一日の学習時間</legend>
            <div className="segmented">
              {[30, 60, 90, 120].map((minutes) => (
                <button
                  type="button"
                  key={minutes}
                  className={dailyMinutes === minutes ? "active" : ""}
                  onClick={() => setDailyMinutes(minutes as 30 | 60 | 90 | 120)}
                >
                  {minutes}分
                </button>
              ))}
            </div>
          </fieldset>
          <button className="primary" type="submit">学習を始める</button>
        </form>
        <div className="plan-list" aria-label="五つの章">
          {chapters.map((day, index) => (
            <article className="panel compact" key={day.title}>
              <span className="day-pill">{index * 6 + 1}～{index * 6 + 6}日目</span>
              <h3>{day.title}</h3>
              <p>{day.intent}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function TodayPage({
  progress,
  content,
  weakAreas,
  accuracies,
  completion,
  onStartQuiz,
  onStartTask,
  onTaskToggle,
  onSetupChange
}: {
  progress: AppProgress;
  content: StudyContent;
  weakAreas: ReturnType<typeof calculateWeakAreas>;
  accuracies: Record<Subcategory, number>;
  completion: number;
  onStartQuiz: (preset: QuizPreset) => void;
  onStartTask: (task: StudyTask) => void;
  onTaskToggle: (taskId: string) => void;
  onSetupChange: (setup: Partial<NonNullable<AppProgress["setup"]>>) => void;
}) {
  const setup = progress.setup!;
  const plan = getDayPlan(setup.activeDay);
  const daysRemaining = daysBetweenLocal(todayLocal(), setup.examDate);
  const warning = easyMaterialWarning(progress.answers, weakAreas);
  const kanjiAccuracy = Math.round(((accuracies["kanji-meaning"] || 0) + (accuracies["kanji-reading"] || 0)) / 2);
  const vocabAccuracy = Math.round(((accuracies["vocabulary-recognition"] || 0) + (accuracies["vocabulary-context"] || 0)) / 2);
  const grammarAccuracy = Math.round(((accuracies["grammar-recognition"] || 0) + (accuracies["grammar-nuance"] || 0)) / 2);
  const activeWeak = weakAreas.filter((w) => w.score > 0).slice(0, 4);
  const nextTask = plan.tasks.find(task => !progress.completedTasks.includes(task.id));
  const done = plan.tasks.filter(task => progress.completedTasks.includes(task.id)).length;
  const plannedMinutes = plan.tasks.reduce((total, task) => total + taskDetails(task, setup.activeDay, setup.dailyMinutes).minutes, 0);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{setup.activeDay}日目</p>
          <h1>{plan.title}</h1>
          <p>{plan.intent}</p>
        </div>
        <div className="header-controls">
          <label>
            学習日
            <select value={setup.activeDay} onChange={(event) => onSetupChange({ activeDay: Number(event.target.value) })}>
              {monthPlan.map(({ day }) => <option key={day} value={day}>{day}日目</option>)}
            </select>
          </label>
        </div>
      </header>

      <section className="daily-route" aria-label="今日の学習手順">
        <div className="page-header"><div><h2>{nextTask ? "今日やること" : "今日の四つの課題を達成しました"}</h2><p>{done} / 4課題を達成 · 目安{plannedMinutes}分</p><p>{nextTask ? "上から順に取り組みましょう。" : "記録をダウンロードして、今日はここまでで大丈夫です。"}</p></div>
          {nextTask ? <button className="primary" onClick={() => onStartTask(nextTask)}>{done === 0 ? "最初の課題へ" : "次の課題へ"}：{nextTask.title}</button> : <ProgressDownload progress={progress} />}
        </div>
        <progress max="4" value={done} aria-label="今日の課題の達成状況" />
        <ol className="daily-steps">
          {plan.tasks.map((task, index) => {
            const details = taskDetails(task, setup.activeDay, setup.dailyMinutes);
            const complete = progress.completedTasks.includes(task.id);
            return <li key={task.id} className={complete ? "step-complete" : task.id === nextTask?.id ? "step-current" : ""}>
              <div><span className="step-number">{index + 1}</span><strong>{details.goal}</strong><span className="step-status">{complete ? "達成" : task.id === nextTask?.id ? "次に取り組む課題" : "未完了"} · 目安{details.minutes}分</span></div>
              <p>{details.detail}</p>
              <div className="action-row"><button onClick={() => onStartTask(task)}>{complete ? "もう一度取り組む" : `${index + 1}番目の課題を始める`}</button>
                {complete && <button onClick={() => onTaskToggle(task.id)}>達成を取り消す</button>}
              </div>
            </li>;
          })}
        </ol>
        <p className="fineprint">達成した課題と経験値は保存されます。翌日は次の学習日に進みます。未完了の課題は「学習日」から戻って続けられます。</p>
      </section>
      {warning && <div className="notice" role="status">{warning}</div>}
      <details className="optional-study"><summary>追加で練習する</summary><div className="action-row">
        <button onClick={() => onStartQuiz("quick")}>短時間で復習</button>
        <button onClick={() => onStartQuiz("weak")}>弱点を練習</button>
        <button onClick={() => onStartQuiz("timed")}>時間を計って練習</button>
      </div></details>
      <Campaign progress={progress} onDay={activeDay => onSetupChange({ activeDay })} />

      <div className="metric-grid">
        <Metric label="試験までの日数" value={daysRemaining < 0 ? "試験日を過ぎました" : `${daysRemaining}`} />
        <Metric label="設定した学習時間" value={`${setup.dailyMinutes}分`} />
        <Metric label="課題の達成率" value={`${completion}%`} />
        <Metric label="未復習の問題" value={`${progress.mistakes.filter((m) => !m.corrected).length}`} />
        <Metric label="漢字の正答率" value={`${kanjiAccuracy}%`} />
        <Metric label="語彙の正答率" value={`${vocabAccuracy}%`} />
        <Metric label="文法の正答率" value={`${grammarAccuracy}%`} />
        <Metric label="連続学習" value={`${calculateStreak(progress)}日`} />
      </div>

      <section className="split">
        <div className="panel">
          <h2>重点的に復習する分野</h2>
          <div className="tag-list">
            {activeWeak.length ? activeWeak.map((weak) => (
              <span className={`risk ${weak.label}`} key={weak.subcategory}>
                {subcategoryLabels[weak.subcategory]} · {riskLabels[weak.label]}
              </span>
            )) : <p>まだ診断の記録がありません。実力診断から始めましょう。</p>}
          </div>
          <p className="fineprint">
            収録内容：漢字 {content.kanji.length}項目、語彙 {content.vocabulary.length}語、文法 {content.grammar.length}項目、問題 {content.questions.length}問。
          </p>
        </div>
      </section>
    </section>
  );
}

function LearnPage({ progress, content, onProgress, guide }: { progress: AppProgress; content: StudyContent; onProgress: (recipe: (current: AppProgress) => AppProgress) => void; guide?: {task: StudyTask; day: number} }) {
  const setup = progress.setup!;
  const [reviewSnapshot, setReviewSnapshot] = useState(progress.review);
  const dueIds = useMemo(() => dueReviewIds(reviewSnapshot, setup.activeDay), [reviewSnapshot, setup.activeDay]);
  const [kind, setKind] = useState<"kanji" | "vocabulary" | "grammar">(guide ? taskDetails(guide.task, guide.day, setup.dailyMinutes).kind : "kanji");
  const [deckMode, setDeckMode] = useState<"daily" | "mixed" | "due" | "hard" | "random">("daily");
  const [sessionSeed, setSessionSeed] = useState(() => `cards-${Date.now()}`);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const cards = useMemo(() => {
    const source: FlashcardItem[] = kind === "kanji" ? content.kanji : kind === "vocabulary" ? content.vocabulary : content.grammar;
    const due = source.filter((item) => dueIds.includes(item.id));
    const hard = [...source].sort((a, b) => b.difficulty - a.difficulty);
    if (guide) {
      const limit = taskDetails(guide.task, guide.day, setup.dailyMinutes).cardCount;
      return [...new Map([...due, ...shuffleDeterministic(source, `daily-${guide.day}-${kind}`)].map(item => [item.id, item])).values()].slice(0, limit);
    }
    if (deckMode === "daily") {
      const chunk = Math.ceil(source.length / 24);
      const day = Math.min(setup.activeDay, 24) - 1;
      const newCards = setup.activeDay <= 24 ? source.slice(day * chunk, (day + 1) * chunk) : [];
      return [...newCards, ...due].filter((item, i, list) => list.findIndex(other => other.id === item.id) === i);
    }
    if (deckMode === "due") return due.slice(0, 60);
    if (deckMode === "hard") return shuffleDeterministic(hard.slice(0, Math.max(80, Math.floor(hard.length / 3))), sessionSeed).slice(0, 60);
    if (deckMode === "random") return shuffleDeterministic(source, sessionSeed).slice(0, 60);
    return [...due, ...shuffleDeterministic(source, sessionSeed)].filter((item, itemIndex, list) => list.findIndex((other) => other.id === item.id) === itemIndex).slice(0, 60);
  }, [content, deckMode, dueIds, kind, sessionSeed, setup.activeDay, setup.dailyMinutes, guide]);
  const card = cards[index];

  const resetDeck = (nextKind = kind, nextMode = deckMode) => {
    setKind(nextKind);
    setReviewSnapshot(progress.review);
    setDeckMode(nextMode);
    setIndex(0);
    setRevealed(false);
    setSessionSeed(`cards-${Date.now()}-${nextKind}-${nextMode}`);
  };

  const rate = (rating: Rating) => {
    if (!card) return;
    onProgress((current) => {
      const existing = current.review.find((item) => item.contentId === card.id);
      const next = { ...scheduleReview(existing, card.id, setup.activeDay, rating), reviewedOn: todayLocal() };
      return { ...current, completedTasks: guide && index + 1 >= cards.length ? [...new Set([...current.completedTasks, guide.task.id])] : current.completedTasks, review: [...current.review.filter((item) => item.contentId !== card.id), next] };
    });
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">単語帳</p>
          <h1>漢字・語彙・文法</h1>
          <p>漢字 {content.kanji.length}項目 · 語彙 {content.vocabulary.length}語 · 文法 {content.grammar.length}項目</p>
        </div>
        {!guide && <div className="flashcard-controls">
          <div className="segmented" role="group" aria-label="学習分野">
            {(["kanji", "vocabulary", "grammar"] as const).map((item) => (
              <button key={item} className={kind === item ? "active" : ""} onClick={() => resetDeck(item, deckMode)}>{kindLabels[item]}</button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="出題範囲">
            {(["daily", "mixed", "due", "hard", "random"] as const).map((item) => (
              <button key={item} className={deckMode === item ? "active" : ""} onClick={() => resetDeck(kind, item)}>{deckLabels[item]}</button>
            ))}
          </div>
          <button onClick={() => resetDeck(kind, deckMode)}>順番を変える</button>
        </div>}
      </header>
      {card ? (
        <article className="study-card">
          <div className="card-meta">
            <span className="day-pill">{index + 1} / {cards.length}</span>
            <span className="day-pill">難易度 {card.difficulty}</span>
            <span className="day-pill">{deckLabels[deckMode]}</span>
          </div>
          <CardFront card={card} />
          {revealed ? <CardBack card={card} /> : <button className="primary" onClick={() => setRevealed(true)}>答えを見る</button>}
          <div className="rating-row">
            {(["again", "hard", "good", "easy"] as const).map((rating) => (
              <button key={rating} onClick={() => rate(rating)} disabled={!revealed}>{ratingLabels[rating]}</button>
            ))}
          </div>
        </article>
      ) : <div className="panel"><h2>{cards.length ? "今回の学習は完了です" : "復習予定のカードはありません"}</h2><p>今回は{index}枚を学習しました。</p>{!guide && <button onClick={() => resetDeck(kind, deckMode)}>次の学習を始める</button>}</div>}
    </section>
  );
}

function CardFront({ card }: { card: FlashcardItem }) {
  if ("pattern" in card) return <h2>{japaneseText(japaneseFormation(card.pattern))}</h2>;
  if ("word" in card) return <h2 className="jp">{japaneseText(card.word)}</h2>;
  return <h2 className="jp mega">{japaneseText(card.kanji)}</h2>;
}

function CardBack({ card }: { card: FlashcardItem }) {
  if ("pattern" in card) {
    return (
      <div className="answer-block">
        <p>{japaneseText(card.japaneseExplanation)}</p>
        <p><strong>接続：</strong>{japaneseText(japaneseFormation(card.formation))}</p>
        <p className="jp">{japaneseText(card.example)}</p>
      </div>
    );
  }
  if ("word" in card) {
    return (
      <div className="answer-block">
        <p><strong>読み：</strong><span className="jp">{japaneseText(card.reading)}</span></p>
        <p>{japaneseText(card.japaneseDefinition)}</p>
        <p className="jp">{japaneseText(card.exampleSentence)}</p>
      </div>
    );
  }
  return (
    <div className="answer-block">
      <p><strong>読み：</strong><span className="jp">{japaneseText(card.readings.join("、").replaceAll(".", "・"))}</span></p>
      {card.exampleCompound && <p><strong>語例：</strong>{japaneseText(card.exampleCompound)}</p>}
      {card.exampleSentence && <p className="jp">{japaneseText(card.exampleSentence)}</p>}
    </div>
  );
}

function QuizPage({
  preset,
  progress,
  content,
  weakAreas,
  onPreset,
  onComplete
}: {
  preset: QuizPreset;
  progress: AppProgress;
  content: StudyContent;
  weakAreas: ReturnType<typeof calculateWeakAreas>;
  onPreset: (preset: QuizPreset) => void;
  onComplete: (answers: ReturnType<typeof makeAnswerRecord>[]) => void;
}) {
  const setup = progress.setup!;
  const [duration, setDuration] = useState(20);
  const [sessionSeed, setSessionSeed] = useState(() => `${Date.now()}`);
  const [weightedIds] = useState(() => progress.mistakes.filter((m) => !m.corrected || m.guessedCorrectly).map((m) => m.questionId));
  const [weakSubs] = useState(() => weakAreas.filter((w) => w.label === "weak" || w.label === "critical").map((w) => w.subcategory));
  const questions = useMemo(() => {
    if (preset === "diagnostic") return balancedDiagnostic(content.questions, sessionSeed);
    if (preset === "quick") return balancedPractice(content.questions, 12, sessionSeed);
    if (preset === "kanji") return selectQuestions(content.questions, { count: 20, seed: sessionSeed, categories: ["kanji"], weightedIds });
    if (preset === "vocab") return selectQuestions(content.questions, { count: 20, seed: sessionSeed, categories: ["vocabulary"], weightedIds });
    if (preset === "grammar") return selectQuestions(content.questions, { count: 20, seed: sessionSeed, categories: ["grammar", "sentence-ordering"], weightedIds });
    if (preset === "reading") return selectQuestions(content.questions, { count: 6, seed: sessionSeed, categories: ["reading"], weightedIds });
    if (preset === "final") return balancedPractice(content.questions, 48, sessionSeed);
    if (preset === "weak") return selectQuestions(content.questions, { count: 20, seed: sessionSeed, subcategories: weakSubs.length ? weakSubs : undefined, weightedIds });
    return balancedPractice(content.questions, Math.max(12, duration), sessionSeed);
  }, [content.questions, duration, preset, sessionSeed, weakSubs, weightedIds]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">練習問題</p>
          <h1>{presetLabel(preset)}</h1>
        </div>
        <div className="toolbar">
          <select value={preset} onChange={(event) => onPreset(event.target.value as QuizPreset)} aria-label="出題形式">
            <option value="diagnostic">実力診断</option>
            <option value="quick">短時間復習</option>
            <option value="weak">弱点克服</option>
            <option value="timed">時間制限あり</option>
            <option value="kanji">漢字</option>
            <option value="vocab">語彙</option>
            <option value="grammar">文法</option>
            <option value="reading">読解</option>
            <option value="final">章末試験</option>
          </select>
          {preset === "timed" && (
            <select value={duration} onChange={(event) => setDuration(Number(event.target.value))} aria-label="制限時間">
              {[10, 20, 30, 45].map((minutes) => <option key={minutes} value={minutes}>{minutes}分</option>)}
            </select>
          )}
        </div>
      </header>
      <QuizSession
        key={`${preset}-${duration}-${questions.map((q) => q.id).join("-")}`}
        questions={questions}
        timedMinutes={preset === "final" ? 60 : preset === "timed" ? duration : undefined}
        activeDay={setup.activeDay}
        onComplete={onComplete}
        backup={<ProgressDownload progress={progress} />}
      />
      <button onClick={() => setSessionSeed(`${Date.now()}`)}>新しい問題に挑戦</button>
    </section>
  );
}

function QuizSession({ questions, timedMinutes, activeDay, onComplete, backup }: { questions: QuizQuestion[]; timedMinutes?: number; activeDay: number; onComplete: (answers: ReturnType<typeof makeAnswerRecord>[]) => void; backup: ReactNode }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, Confidence>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [startedAt] = useState(() => Date.now());
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState((timedMinutes ?? 0) * 60);
  const [paused, setPaused] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof makeAnswerRecord>[] | null>(null);
  const question = questions[current];

  useEffect(() => {
    setQuestionStartedAt(Date.now());
  }, [current]);

  useEffect(() => {
    if (!timedMinutes || paused || results) return;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused, results, timedMinutes]);

  useEffect(() => {
    if (timedMinutes && remaining === 0 && !results) submit();
  }, [remaining]);

  const move = (next: number) => {
    if (next === current) return;
    if (question) {
      setElapsed((currentElapsed) => ({
        ...currentElapsed,
        [question.id]: (currentElapsed[question.id] ?? 0) + (Date.now() - questionStartedAt)
      }));
    }
    setCurrent(Math.max(0, Math.min(questions.length - 1, next)));
  };

  const submit = () => {
    const unanswered = questions.filter((q) => !selected[q.id]);
    if (results) return;
    if (unanswered.length && (!timedMinutes || remaining !== 0) && !window.confirm(`未回答が${unanswered.length}問あります。提出しますか。`)) return;
    const sessionId = `s-${startedAt}-${activeDay}`;
    const records = questions.map((q) =>
      makeAnswerRecord({
        question: q,
        selectedAnswer: selected[q.id] ?? "",
        confidence: confidence[q.id] ?? "unsure",
        elapsedMs: (elapsed[q.id] ?? 0) + (q.id === question?.id ? Date.now() - questionStartedAt : 0),
        sessionId,
        flagged: flags[q.id]
      })
    );
    setResults(records);
    onComplete(records);
  };

  if (!question) return <div className="panel">該当する問題がありません。</div>;

  if (results) {
    const correctCount = results.filter((r) => r.correct).length;
    const slowCorrect = results.filter((r) => r.correct && r.elapsedMs > 75_000);
    const careless = results.filter((r) => !r.correct && r.elapsedMs < 12_000);
    return (
      <section className="panel">
        <h2>学習結果</h2>
        {backup}
        <div className="metric-grid small">
          <Metric label="正解数" value={`${correctCount}/${results.length}`} />
          <Metric label="時間のかかった正解" value={`${slowCorrect.length}`} />
          <Metric label="急いで間違えた問題" value={`${careless.length}`} />
          <Metric label="推測での正解" value={`${results.filter((r) => r.correct && r.confidence === "guess").length}`} />
        </div>
        <div className="result-list" aria-live="polite">
          {results.map((record, index) => (
            <article className="result-row" key={record.questionId}>
              <strong>{index + 1}. {record.correct ? "正解" : "要復習"}</strong>
              <p>{questions[index].prompt}</p>
              <small>回答：{record.selectedAnswer || "未回答"} · 正解：{record.correctAnswer} · 確信度：{confidenceLabel(record.confidence)}</small>
              <p>{questions[index].explanation}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-shell">
      <div className="quiz-topline">
        <span>問題 {current + 1} / {questions.length}</span>
        {timedMinutes && <strong>{formatTime(remaining)}</strong>}
        {timedMinutes && <button onClick={() => {
          if (!paused && question) setElapsed(value => ({ ...value, [question.id]: (value[question.id] ?? 0) + Date.now() - questionStartedAt }));
          setPaused(value => !value);
          setQuestionStartedAt(Date.now());
        }}>{paused ? "再開" : "一時停止"}</button>}
      </div>
      {paused ? <div className="panel">一時停止中</div> : <article className="question-card">
        <div className="question-meta">
          <span>{subcategoryLabels[question.subcategory]}</span>
          <button className={flags[question.id] ? "flagged" : ""} onClick={() => setFlags((value) => ({ ...value, [question.id]: !value[question.id] }))}>
            {flags[question.id] ? "確認待ち" : "後で確認"}
          </button>
        </div>
        <h2>{question.prompt}</h2>
        <div className="choice-grid">
          {question.choices.map((choice) => (
            <button
              key={choice}
              className={selected[question.id] === choice ? "selected" : ""}
              onClick={() => setSelected((value) => ({ ...value, [question.id]: choice }))}
            >
              {question.type === "ordering" ? choice.split("|").join(" / ") : choice}
            </button>
          ))}
        </div>
        <fieldset className="confidence">
          <legend>確信度</legend>
          <div className="segmented">
            {(["sure", "unsure", "guess"] as const).map((item) => (
              <button type="button" key={item} className={(confidence[question.id] ?? "unsure") === item ? "active" : ""} onClick={() => setConfidence((value) => ({ ...value, [question.id]: item }))}>
                {confidenceLabel(item)}
              </button>
            ))}
          </div>
        </fieldset>
      </article>}
      {!paused && <div className="quiz-nav">
        <button onClick={() => move(current - 1)} disabled={current === 0}>前へ</button>
        <div className="question-dots" aria-label="問題の移動">
          {questions.map((q, index) => (
            <button key={q.id} className={`${index === current ? "active" : ""} ${selected[q.id] ? "answered" : ""}`} onClick={() => move(index)}>
              {index + 1}
            </button>
          ))}
        </div>
        {current === questions.length - 1 ? <button className="primary" onClick={submit}>提出</button> : <button onClick={() => move(current + 1)}>次へ</button>}
      </div>}
    </section>
  );
}

function MistakesPage({ progress, content, onStartQuiz }: { progress: AppProgress; content: StudyContent; onStartQuiz: (preset: QuizPreset) => void }) {
  const [filter, setFilter] = useState<"all" | StudyCategory | "guess" | "repeat" | "open">("open");
  const visible = progress.mistakes.filter((mistake) => {
    if (filter === "all") return true;
    if (filter === "guess") return mistake.guessedCorrectly;
    if (filter === "repeat") return mistake.timesMissed > 1;
    if (filter === "open") return !mistake.corrected;
    return mistake.category === filter;
  });
  const questionMap = new Map(content.questions.map((q) => [q.id, q]));
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">間違えた問題の復習</p>
          <h1>復習する問題：{visible.length}問</h1>
        </div>
        <div className="toolbar">
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="復習の絞り込み">
            <option value="open">未克服</option>
            <option value="all">すべて</option>
            <option value="kanji">漢字</option>
            <option value="vocabulary">語彙</option>
            <option value="grammar">文法</option>
            <option value="guess">推測で正解</option>
            <option value="repeat">繰り返し間違えた問題</option>
          </select>
          <button onClick={() => onStartQuiz("weak")}>弱点を練習</button>
        </div>
      </header>
      <div className="mistake-list">
        {visible.length ? visible.map((mistake) => {
          const question = questionMap.get(mistake.questionId);
          return (
            <article className="panel compact" key={mistake.questionId}>
              <span className={`risk ${mistake.corrected ? "strong" : "weak"}`}>{mistake.corrected ? "克服済み" : "要復習"}</span>
              <h3>{question?.prompt ?? "過去の問題"}</h3>
              <p>回答：{japaneseText(mistake.selectedAnswer || "未回答")} · 正解：{japaneseText(mistake.correctAnswer)}</p>
              <p>{japaneseText(mistake.explanation)}</p>
              <small>誤答：{mistake.timesMissed}回 · 確信度：{confidenceLabel(mistake.confidence)}</small>
            </article>
          );
        }) : <div className="panel">該当する復習問題はありません。</div>}
      </div>
    </section>
  );
}

function ProgressPage({ progress, weakAreas, accuracies }: { progress: AppProgress; weakAreas: ReturnType<typeof calculateWeakAreas>; accuracies: Record<Subcategory, number> }) {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">学習記録</p>
          <h1>分野ごとの学習状況</h1>
          <p>正答率と誤答の傾向から復習する分野を確認できます。本試験の得点予測ではありません。</p>
        </div>
      </header>
      <div className="split">
        <div className="panel">
          <h2>分野別の正答率</h2>
          {Object.entries(accuracies).map(([subcategory, value]) => (
            <div className="bar-row" key={subcategory}>
              <span>{subcategoryLabels[subcategory as Subcategory]}</span>
              <div className="bar"><span style={{ width: `${value}%` }} /></div>
              <strong>{value}%</strong>
            </div>
          ))}
        </div>
        <div className="panel">
          <h2>復習の優先度</h2>
          {weakAreas.slice(0, 8).map((weak) => (
            <article className="risk-row" key={weak.subcategory}>
              <span className={`risk ${weak.label}`}>{riskLabels[weak.label]}</span>
              <strong>{subcategoryLabels[weak.subcategory]}</strong>
              <small>{weak.reasons.length ? weak.reasons.join(", ") : "まだ記録がありません"}</small>
            </article>
          ))}
        </div>
      </div>
      <section className="panel">
        <h2>日別の学習記録</h2>
        {dailyActivity(progress).length ? <table className="history-table"><thead><tr><th>学習日</th><th>解答数</th><th>正解数</th><th>一日の目標</th></tr></thead><tbody>{dailyActivity(progress).map(day => <tr key={day.date}><td>{day.date}</td><td>{day.questions}問</td><td>{day.correct}問</td><td>{day.questions >= 20 ? "達成" : "継続中"}</td></tr>)}</tbody></table> : <p>まだ解答の記録がありません。</p>}
      </section>
      <section className="panel">
        <h2>試験前の確認</h2>
        <ul className="checklist">
          {[
            "一つの文法問題に時間をかけすぎない。",
            "明らかに違う選択肢から除く。",
            "接続表現と文末に注意する。",
            "並べ替えでは、まとまりとなる表現を見つける。",
            "未回答を残さず、最も適切だと思うものを選ぶ。",
            "後半の読解に使う時間を確保する。",
            "繰り返し間違えた問題を優先して復習する。"
          ].map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </section>
  );
}

function SettingsPage({ progress, content, onProgress }: { progress: AppProgress; content: StudyContent; onProgress: (progress: AppProgress) => void }) {
  const [message, setMessage] = useState("");
  const setup = progress.setup!;
  const patchSetup = (patch: Partial<NonNullable<AppProgress["setup"]>>) => onProgress({ ...progress, setup: { ...setup, ...patch } });

  const readFile = (file: File, handler: (text: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => handler(String(reader.result ?? ""));
    reader.onerror = () => setMessage("選択したファイルを読み込めませんでした。");
    reader.readAsText(file);
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">設定</p>
          <h1>学習記録と設定</h1>
        </div>
      </header>
      {message && <div className="notice" role="status">{message}</div>}
      <div className="split">
        <section className="panel">
          <h2>学習計画</h2>
          <label>試験日<input type="date" value={setup.examDate} onChange={(event) => patchSetup({ examDate: event.target.value })} /></label>
          <label>学習日<select value={setup.activeDay} onChange={(event) => patchSetup({ activeDay: Number(event.target.value) })}>{monthPlan.map(({ day }) => <option key={day} value={day}>{day}日目</option>)}</select></label>
          <label>一日の学習時間<select value={setup.dailyMinutes} onChange={(event) => patchSetup({ dailyMinutes: Number(event.target.value) as 30 | 60 | 90 | 120 })}>{[30, 60, 90, 120].map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
          <label>表示<select value={progress.theme} onChange={(event) => onProgress({ ...progress, theme: event.target.value as AppProgress["theme"] })}><option value="system">端末に合わせる</option><option value="light">明るい表示</option><option value="dark">暗い表示</option></select></label>
        </section>
        <section className="panel">
          <h2>記録の保存と復元</h2>
          <p className="fineprint">追加語彙の出典：<a href="https://www.edrdg.org/">電子化辞書研究開発グループ</a>、<a href="https://bond-lab.github.io/wnja/index.ja.html">日本語ワードネット（一・一版）</a>。著作権：情報通信研究機構（二〇〇九～二〇一一年）、フランシス・ボンド（二〇一二～二〇二四年）、栗林孝行（二〇一六～二〇二四年）。<a href={`${import.meta.env.BASE_URL}licenses/jmdict.txt`}>読みの利用条件</a>・<a href={`${import.meta.env.BASE_URL}licenses/japanese-wordnet.txt`}>語義の利用条件</a>。</p>
          <p>学習記録はこの端末のブラウザーに自動保存され、三十日を過ぎても残ります。別の端末への移行やブラウザーのデータ削除に備え、定期的に書き出してください。</p>
          <label className="file-label">教材ファイルを読み込む<input type="file" accept="application/json" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            readFile(file, (text) => {
              try {
                const imported = parseContentJson(text);
                onProgress({ ...progress, importedContent: imported });
                setMessage("教材を読み込みました。");
              } catch (error) {
                setMessage("教材ファイルの形式を確認してください。");
              }
            });
          }} /></label>
          <label className="file-label">語彙一覧を読み込む<input type="file" accept=".csv,text/csv" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            readFile(file, (text) => {
              try {
                const vocabulary = parseVocabularyCsv(text);
                const issues = validateContent({ vocabulary });
                if (issues.length) throw new Error(issues[0].message);
                onProgress({ ...progress, importedContent: { ...progress.importedContent, vocabulary } });
                setMessage("語彙一覧を読み込みました。");
              } catch (error) {
                setMessage("語彙一覧の形式を確認してください。");
              }
            });
          }} /></label>
          <button className="danger" onClick={() => window.confirm("このブラウザーの学習記録をすべて初期化しますか。必要な記録は先に書き出してください。") && onProgress({ ...emptyProgress, setup: createDefaultSetup() })}>記録を初期化する</button>
          <p className="fineprint">収録内容：漢字 {content.kanji.length}項目、語彙 {content.vocabulary.length}語、文法 {content.grammar.length}項目、問題 {content.questions.length}問。</p>
        </section>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function calculateStreak(progress: AppProgress): number {
  return campaignStats(progress).streak;
}

function balancedDiagnostic(questions: QuizQuestion[], seed: string): QuizQuestion[] {
  const subcategories: Subcategory[] = ["kanji-meaning", "kanji-reading", "vocabulary-recognition", "vocabulary-context", "grammar-recognition", "grammar-nuance", "sentence-ordering", "short-reading"];
  return subcategories.flatMap((subcategory) => selectQuestions(questions, { count: subcategory === "sentence-ordering" || subcategory === "short-reading" ? 5 : 6, seed: `${seed}-${subcategory}`, subcategories: [subcategory] })).slice(0, 46);
}

function presetLabel(preset: QuizPreset): string {
  return {
    diagnostic: "実力診断",
    quick: "短時間復習",
    weak: "弱点克服",
    timed: "時間制限付き練習",
    kanji: "漢字",
    vocab: "語彙",
    grammar: "文法",
    reading: "読解",
    final: "章末試験"
  }[preset];
}

function confidenceLabel(confidence: Confidence): string {
  return { sure: "確信あり", unsure: "やや不安", guess: "推測" }[confidence];
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}
