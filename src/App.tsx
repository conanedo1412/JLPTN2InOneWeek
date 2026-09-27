import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { starterContent } from "./data/content";
import { dueReviewIds, scheduleReview } from "./features/learn/scheduler";
import { updateMistakes } from "./features/mistakes/mistakeLogic";
import { balancedPractice, makeAnswerRecord, selectQuestions } from "./features/quiz/quizLogic";
import { Campaign } from "./features/progress/CampaignDashboard";
import { campaignStats } from "./features/progress/campaign";
import { accuraciesBySubcategory, calculateWeakAreas, easyMaterialWarning, overallCompletion, subcategoryLabels } from "./features/progress/scoring";
import { chapters, createDefaultSetup, monthPlan, getDayPlan } from "./features/study-plan/plan";
import { emptyProgress, loadProgress, saveProgress } from "./storage/progressStorage";
import { exportProgress, importProgress, parseContentJson, parseVocabularyCsv, validateContent } from "./services/importExport";
import type { AppProgress, Confidence, GrammarItem, QuizQuestion, Rating, StudyCategory, StudyContent, Subcategory, VocabularyItem } from "./types";
import { daysBetweenLocal, todayLocal } from "./utils/date";
import { shuffleDeterministic } from "./utils/random";

type Page = "today" | "learn" | "quiz" | "mistakes" | "progress" | "settings";
type QuizPreset = "diagnostic" | "quick" | "weak" | "timed" | "kanji" | "vocab" | "grammar" | "reading" | "final";
type FlashcardItem = GrammarItem | VocabularyItem | StudyContent["kanji"][number];

const navItems: { page: Page; label: string }[] = [
  { page: "today", label: "Today" },
  { page: "learn", label: "Cards" },
  { page: "quiz", label: "Quiz" },
  { page: "mistakes", label: "Mistakes" },
  { page: "progress", label: "Progress" },
  { page: "settings", label: "Settings" }
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
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);
  return [progress, setProgress] as const;
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
            <h1>Study data recovered</h1>
            <p>Something unexpected happened while rendering. Reloading usually restores the local progress safely.</p>
            <button onClick={() => window.location.reload()}>Reload</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [progress, setProgress] = usePersistentProgress();
  const [page, setPage] = useState<Page>("today");
  const [quizPreset, setQuizPreset] = useState<QuizPreset>("quick");
  const [toast, setToast] = useState("");
  const content = useMemo(() => mergeContent(progress), [progress]);
  const setup = progress.setup;
  const level = campaignStats(progress).level;
  const previousLevel = useRef(level);
  useEffect(() => {
    if (level > previousLevel.current) setToast(`レベルアップ！レベル${level}に到達しました。`);
    previousLevel.current = level;
  }, [level]);

  useEffect(() => {
    const update = () => setToast("An update is available.");
    const offline = () => setToast("Offline study is ready.");
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
        <SetupPage onComplete={(nextSetup) => setProgress({ ...progress, setup: nextSetup })} />
      </ErrorBoundary>
    );
  }

  const updateProgress = (recipe: (current: AppProgress) => AppProgress) => setProgress((current) => recipe(current));

  const startQuiz = (preset: QuizPreset) => {
    setQuizPreset(preset);
    setPage("quiz");
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">N2</span>
            <div>
              <strong>N2 Quest</strong>
              <span>The 30-day adventure</span>
            </div>
          </div>
          <nav aria-label="Main navigation">
            {navItems.map((item) => (
              <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => setPage(item.page)}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="content" id="main">
          {page === "today" && (
            <TodayPage
              progress={progress}
              content={content}
              weakAreas={weakAreas}
              accuracies={accuracies}
              completion={completion}
              onStartQuiz={startQuiz}
              onNavigate={setPage}
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
          {page === "learn" && <LearnPage progress={progress} content={content} onProgress={updateProgress} />}
          {page === "quiz" && (
            <QuizPage
              preset={quizPreset}
              progress={progress}
              content={content}
              weakAreas={weakAreas}
              onPreset={setQuizPreset}
              onComplete={(answers) => {
                updateProgress((current) => {
                  const nextAnswers = [...current.answers, ...answers];
                  const nextMistakes = updateMistakes(current.mistakes, answers, content.questions);
                  return {
                    ...current,
                    answers: nextAnswers,
                    mistakes: nextMistakes,
                    progressHistory: [
                      ...current.progressHistory,
                      {
                        date: todayLocal(),
                        overallCompletion: completion,
                        accuracies: accuraciesBySubcategory(nextAnswers)
                      }
                    ].slice(-30)
                  };
                });
              }}
            />
          )}
          {page === "mistakes" && <MistakesPage progress={progress} content={content} onStartQuiz={startQuiz} />}
          {page === "progress" && <ProgressPage progress={progress} weakAreas={weakAreas} accuracies={accuracies} />}
          {page === "settings" && <SettingsPage progress={progress} content={content} onProgress={setProgress} />}
        </main>

        <nav className="bottom-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => setPage(item.page)}>
              {item.label}
            </button>
          ))}
        </nav>

        {toast && (
          <div className="toast" role="status">
            <span>{toast}</span>
            {toast.includes("update") ? <button onClick={() => window.dispatchEvent(new Event("pwa-apply-update"))}>Update now</button> : <button onClick={() => setToast("")}>OK</button>}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function SetupPage({ onComplete }: { onComplete: (setup: NonNullable<AppProgress["setup"]>) => void }) {
  const defaults = createDefaultSetup();
  const [examDate, setExamDate] = useState(defaults.examDate);
  const [dailyMinutes, setDailyMinutes] = useState<30 | 60 | 90 | 120>(90);
  return (
    <main className="setup-shell">
      <section className="setup-hero">
        <div>
          <p className="eyebrow">JLPT N2 · 30 days</p>
          <h1>N2 Quest</h1>
          <p>
            A month of kanji, vocabulary, grammar, and reading. Build your skills one day at a time.
          </p>
        </div>
      </section>
      <section className="setup-grid">
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            onComplete({ examDate, dailyMinutes, activeDay: 1, completedDays: [] });
          }}
        >
          <h2>Setup</h2>
          <label>
            Exam date
            <input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} />
          </label>
          <fieldset>
            <legend>Daily study time</legend>
            <div className="segmented">
              {[30, 60, 90, 120].map((minutes) => (
                <button
                  type="button"
                  key={minutes}
                  className={dailyMinutes === minutes ? "active" : ""}
                  onClick={() => setDailyMinutes(minutes as 30 | 60 | 90 | 120)}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </fieldset>
          <button className="primary" type="submit">Start dashboard</button>
        </form>
        <div className="plan-list" aria-label="Five chapters">
          {chapters.map((day, index) => (
            <article className="panel compact" key={day.title}>
              <span className="day-pill">Days {index * 6 + 1}–{index * 6 + 6}</span>
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
  onNavigate,
  onTaskToggle,
  onSetupChange
}: {
  progress: AppProgress;
  content: StudyContent;
  weakAreas: ReturnType<typeof calculateWeakAreas>;
  accuracies: Record<Subcategory, number>;
  completion: number;
  onStartQuiz: (preset: QuizPreset) => void;
  onNavigate: (page: Page) => void;
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
  const continuePreset: QuizPreset = setup.activeDay === 1 ? "diagnostic" : setup.activeDay % 6 === 0 ? "final" : "weak";

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Day {setup.activeDay}</p>
          <h1>{plan.title}</h1>
          <p>{plan.intent}</p>
        </div>
        <div className="header-controls">
          <label>
            Active day
            <select value={setup.activeDay} onChange={(event) => onSetupChange({ activeDay: Number(event.target.value) })}>
              {monthPlan.map(({ day }) => <option key={day} value={day}>Day {day}</option>)}
            </select>
          </label>
        </div>
      </header>

      {warning && <div className="notice" role="status">{warning}</div>}
      <Campaign progress={progress} onDay={activeDay => onSetupChange({ activeDay })} />

      <div className="metric-grid">
        <Metric label="Days to exam" value={daysRemaining < 0 ? "Date elapsed" : `${daysRemaining}`} />
        <Metric label="Estimated study" value={`${setup.dailyMinutes} min`} />
        <Metric label="Overall complete" value={`${completion}%`} />
        <Metric label="Mistakes waiting" value={`${progress.mistakes.filter((m) => !m.corrected).length}`} />
        <Metric label="Kanji accuracy" value={`${kanjiAccuracy}%`} />
        <Metric label="Vocabulary accuracy" value={`${vocabAccuracy}%`} />
        <Metric label="Grammar accuracy" value={`${grammarAccuracy}%`} />
        <Metric label="Study streak" value={`${calculateStreak(progress)} day${calculateStreak(progress) === 1 ? "" : "s"}`} />
      </div>

      <div className="action-row">
        <button className="primary" onClick={() => onStartQuiz(continuePreset)}>Continue Today's Study</button>
        <button onClick={() => onStartQuiz("quick")}>Quick 10-Minute Review</button>
        <button onClick={() => onStartQuiz("weak")}>Practice Weak Areas</button>
        <button onClick={() => onStartQuiz("timed")}>Timed Mixed Quiz</button>
      </div>

      <section className="split">
        <div className="panel">
          <h2>Today's tasks</h2>
          <div className="task-list">
            {plan.tasks.map((task) => (
              <div className="task-row" key={task.id}>
                <input aria-label={`Complete ${task.title}`} type="checkbox" checked={progress.completedTasks.includes(task.id)} onChange={() => onTaskToggle(task.id)} />
                <span>
                  <strong>{task.title}</strong>
                  <small>{Math.round(task.minutes * setup.dailyMinutes / 90)} min · {task.focus}</small>
                </span>
                <button onClick={() => task.mode === "learn" ? onNavigate("learn") : task.mode === "mistakes" ? onNavigate("mistakes") : onStartQuiz(task.id.endsWith("reading") ? "reading" : task.mode === "diagnostic" ? "diagnostic" : task.mode === "timed" ? "final" : (["kanji", "vocab", "grammar", "grammar", "reading", "weak"] as QuizPreset[])[(setup.activeDay - 1) % 6])}>Start</button>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Current weak categories</h2>
          <div className="tag-list">
            {activeWeak.length ? activeWeak.map((weak) => (
              <span className={`risk ${weak.label}`} key={weak.subcategory}>
                {subcategoryLabels[weak.subcategory]} · {weak.label}
              </span>
            )) : <p>No diagnostic data yet. Start with the mixed diagnostic.</p>}
          </div>
          <p className="fineprint">
            Bundled content: {content.kanji.length} kanji, {content.vocabulary.length} vocabulary items, {content.grammar.length} grammar patterns, {content.questions.length} questions.
          </p>
        </div>
      </section>
    </section>
  );
}

function LearnPage({ progress, content, onProgress }: { progress: AppProgress; content: StudyContent; onProgress: (recipe: (current: AppProgress) => AppProgress) => void }) {
  const setup = progress.setup!;
  const [reviewSnapshot, setReviewSnapshot] = useState(progress.review);
  const dueIds = useMemo(() => dueReviewIds(reviewSnapshot, setup.activeDay), [reviewSnapshot, setup.activeDay]);
  const [kind, setKind] = useState<"kanji" | "vocabulary" | "grammar">("kanji");
  const [deckMode, setDeckMode] = useState<"daily" | "mixed" | "due" | "hard" | "random">("daily");
  const [sessionSeed, setSessionSeed] = useState(() => `cards-${Date.now()}`);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const cards = useMemo(() => {
    const source: FlashcardItem[] = kind === "kanji" ? content.kanji : kind === "vocabulary" ? content.vocabulary : content.grammar;
    const due = source.filter((item) => dueIds.includes(item.id));
    const hard = [...source].sort((a, b) => b.difficulty - a.difficulty);
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
  }, [content, deckMode, dueIds, kind, sessionSeed, setup.activeDay]);
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
      const next = scheduleReview(existing, card.id, setup.activeDay, rating);
      return { ...current, review: [...current.review.filter((item) => item.contentId !== card.id), next] };
    });
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Flashcards</p>
          <h1>Kanji, vocabulary, and grammar cards</h1>
          <p>{content.kanji.length} kanji cards · {content.vocabulary.length} vocabulary cards · {content.grammar.length} grammar cards</p>
        </div>
        <div className="flashcard-controls">
          <div className="segmented" role="group" aria-label="Card type">
            {(["kanji", "vocabulary", "grammar"] as const).map((item) => (
              <button key={item} className={kind === item ? "active" : ""} onClick={() => resetDeck(item, deckMode)}>{item}</button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Deck mode">
            {(["daily", "mixed", "due", "hard", "random"] as const).map((item) => (
              <button key={item} className={deckMode === item ? "active" : ""} onClick={() => resetDeck(kind, item)}>{item}</button>
            ))}
          </div>
          <button onClick={() => resetDeck(kind, deckMode)}>Shuffle deck</button>
        </div>
      </header>
      {card ? (
        <article className="study-card">
          <div className="card-meta">
            <span className="day-pill">{index + 1} / {cards.length}</span>
            <span className="day-pill">difficulty {card.difficulty}</span>
            <span className="day-pill">{deckMode}</span>
          </div>
          <CardFront card={card} />
          {revealed ? <CardBack card={card} /> : <button className="primary" onClick={() => setRevealed(true)}>Reveal answer</button>}
          <div className="rating-row">
            {(["again", "hard", "good", "easy"] as const).map((rating) => (
              <button key={rating} onClick={() => rate(rating)} disabled={!revealed}>{rating}</button>
            ))}
          </div>
        </article>
      ) : <div className="panel"><h2>{cards.length ? "Deck complete" : "No cards due"}</h2><p>{index} cards reviewed in this session.</p><button onClick={() => resetDeck(kind, deckMode)}>Start another deck</button></div>}
    </section>
  );
}

function CardFront({ card }: { card: FlashcardItem }) {
  if ("pattern" in card) return <h2>{card.pattern}</h2>;
  if ("word" in card) return <><h2 className="jp">{card.word}</h2><p>{card.partOfSpeech}</p></>;
  return <h2 className="jp mega">{card.kanji}</h2>;
}

function CardBack({ card }: { card: FlashcardItem }) {
  if ("pattern" in card) {
    return (
      <div className="answer-block">
        <p>{card.meaning}</p>
        <p><strong>Formation:</strong> {card.formation}</p>
        <p className="jp">{card.example}</p>
        <p>{card.translation}</p>
        <p><strong>Do not confuse with:</strong> {card.commonConfusion}</p>
        <p><strong>Hint:</strong> {card.memoryHint}</p>
      </div>
    );
  }
  if ("word" in card) {
    return (
      <div className="answer-block">
        <p><strong>Reading:</strong> <span className="jp">{card.reading}</span></p>
        <p>{card.meaning} · {card.japaneseDefinition}</p>
        <p className="jp">{card.exampleSentence}</p>
        <p>{card.translation}</p>
        <p><strong>Collocation:</strong> {card.collocation} · <strong>Similar:</strong> {card.similarWord}</p>
      </div>
    );
  }
  return (
    <div className="answer-block">
      <p>{card.meaning}</p>
      <p><strong>Reading:</strong> <span className="jp">{card.readings.join("、")}</span></p>
      <p className="jp">{card.exampleSentence}</p>
        <p><strong>Tags:</strong> {card.tags.join(", ")}</p>
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
      />
      <button onClick={() => setSessionSeed(`${Date.now()}`)}>新しい問題に挑戦</button>
    </section>
  );
}

function QuizSession({ questions, timedMinutes, activeDay, onComplete }: { questions: QuizQuestion[]; timedMinutes?: number; activeDay: number; onComplete: (answers: ReturnType<typeof makeAnswerRecord>[]) => void }) {
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
          <p className="eyebrow">Mistake review</p>
          <h1>{visible.length} items awaiting attention</h1>
        </div>
        <div className="toolbar">
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Mistake filter">
            <option value="open">Not yet corrected</option>
            <option value="all">All mistakes</option>
            <option value="kanji">Kanji</option>
            <option value="vocabulary">Vocabulary</option>
            <option value="grammar">Grammar</option>
            <option value="guess">Guessed correctly</option>
            <option value="repeat">Missed more than once</option>
          </select>
          <button onClick={() => onStartQuiz("weak")}>Practice weak areas</button>
        </div>
      </header>
      <div className="mistake-list">
        {visible.length ? visible.map((mistake) => {
          const question = questionMap.get(mistake.questionId);
          return (
            <article className="panel compact" key={mistake.questionId}>
              <span className={`risk ${mistake.corrected ? "strong" : "weak"}`}>{mistake.corrected ? "corrected" : "needs review"}</span>
              <h3>{question?.prompt ?? mistake.questionId}</h3>
              <p>Your answer: {mistake.selectedAnswer || "blank"} · Correct: {mistake.correctAnswer}</p>
              <p>{mistake.explanation}</p>
              <small>Missed {mistake.timesMissed} time{mistake.timesMissed === 1 ? "" : "s"} · Confidence: {mistake.confidence}</small>
            </article>
          );
        }) : <div className="panel">No mistakes match this filter.</div>}
      </div>
    </section>
  );
}

function ProgressPage({ progress, weakAreas, accuracies }: { progress: AppProgress; weakAreas: ReturnType<typeof calculateWeakAreas>; accuracies: Record<Subcategory, number> }) {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Progress</p>
          <h1>Readiness trend, not a score prediction</h1>
          <p>The app ranks risk areas. It does not estimate or guarantee official JLPT points.</p>
        </div>
      </header>
      <div className="split">
        <div className="panel">
          <h2>Accuracy by skill</h2>
          {Object.entries(accuracies).map(([subcategory, value]) => (
            <div className="bar-row" key={subcategory}>
              <span>{subcategoryLabels[subcategory as Subcategory]}</span>
              <div className="bar"><span style={{ width: `${value}%` }} /></div>
              <strong>{value}%</strong>
            </div>
          ))}
        </div>
        <div className="panel">
          <h2>Risk areas</h2>
          {weakAreas.slice(0, 8).map((weak) => (
            <article className="risk-row" key={weak.subcategory}>
              <span className={`risk ${weak.label}`}>{weak.label}</span>
              <strong>{subcategoryLabels[weak.subcategory]}</strong>
              <small>{weak.reasons.length ? weak.reasons.join(", ") : "No evidence yet"}</small>
            </article>
          ))}
        </div>
      </div>
      <section className="panel">
        <h2>Final chapter checklist</h2>
        <ul className="checklist">
          {[
            "Do not get stuck on one grammar question.",
            "Eliminate clearly wrong answers first.",
            "Pay attention to connectors and sentence endings.",
            "For sentence ordering, identify fixed grammar chunks.",
            "Guess rather than leaving an answer blank.",
            "Protect time for later sections.",
            "Review repeated personal mistakes, not every topic."
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
    reader.onerror = () => setMessage("Could not read the selected file.");
    reader.readAsText(file);
  };

  const download = (name: string, text: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Local data and deployment-safe content</h1>
        </div>
      </header>
      {message && <div className="notice" role="status">{message}</div>}
      <div className="split">
        <section className="panel">
          <h2>Plan controls</h2>
          <label>Exam date<input type="date" value={setup.examDate} onChange={(event) => patchSetup({ examDate: event.target.value })} /></label>
          <label>Active day<select value={setup.activeDay} onChange={(event) => patchSetup({ activeDay: Number(event.target.value) })}>{monthPlan.map(({ day }) => <option key={day} value={day}>Day {day}</option>)}</select></label>
          <label>Daily minutes<select value={setup.dailyMinutes} onChange={(event) => patchSetup({ dailyMinutes: Number(event.target.value) as 30 | 60 | 90 | 120 })}>{[30, 60, 90, 120].map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
          <label>Theme<select value={progress.theme} onChange={(event) => onProgress({ ...progress, theme: event.target.value as AppProgress["theme"] })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        </section>
        <section className="panel">
          <h2>Import and export</h2>
          <label className="file-label">Import study content JSON<input type="file" accept="application/json" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            readFile(file, (text) => {
              try {
                const imported = parseContentJson(text);
                onProgress({ ...progress, importedContent: imported });
                setMessage("Study content imported.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Invalid content file.");
              }
            });
          }} /></label>
          <label className="file-label">Import vocabulary CSV<input type="file" accept=".csv,text/csv" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            readFile(file, (text) => {
              try {
                const vocabulary = parseVocabularyCsv(text);
                const issues = validateContent({ vocabulary });
                if (issues.length) throw new Error(issues[0].message);
                onProgress({ ...progress, importedContent: { ...progress.importedContent, vocabulary } });
                setMessage("Vocabulary CSV imported.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "This file does not contain a valid vocabulary list.");
              }
            });
          }} /></label>
          <button onClick={() => download("jlpt-n2-progress.json", exportProgress(progress))}>Export all progress</button>
          <label className="file-label">Import progress JSON<input type="file" accept="application/json" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            readFile(file, (text) => {
              try {
                onProgress(importProgress(text));
                setMessage("Progress restored.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Progress file version is unsupported.");
              }
            });
          }} /></label>
          <button className="danger" onClick={() => window.confirm("Reset all local progress? This cannot be undone.") && onProgress({ ...emptyProgress, setup: createDefaultSetup() })}>Reset progress</button>
          <p className="fineprint">Current validated content: {content.kanji.length} kanji, {content.vocabulary.length} vocabulary, {content.grammar.length} grammar, {content.questions.length} questions.</p>
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
