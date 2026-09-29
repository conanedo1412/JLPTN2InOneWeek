# N2 Quest: 30-Day Adventure

A local-first React PWA for a month of N2 preparation: kanji, vocabulary, grammar, sentence ordering, reading, and mistake recovery. Best suited to learners already studying around N2 level, not beginners.

The goal is 90/120 across language knowledge and reading, but practice accuracy is not an official scaled JLPT score and completing this course cannot guarantee a result. Listening is deliberately excluded from the course; passing the actual JLPT still requires listening and the official section minimums. Supplement this finite practice bank with unseen official sample questions and full-length practice exams.

The bundled questions are original JLPT-style practice material. They are not official JLPT questions and are not copied from commercial prep books.

## Requirements

- Node.js 22 or newer
- pnpm

## Local Development

```bash
pnpm install
pnpm run dev
pnpm run validate:content
pnpm run test
pnpm run typecheck
pnpm run build
```

Open the Vite URL printed by `pnpm run dev`.

## What Is Included

- First-run setup with exam date and daily study time
- Thirty-day campaign with five six-day chapters and checkpoint trials
- Persistent XP, levels, daily question goals, badges, and per-skill evidence
- XP counts each question's best performance once; task checkboxes do not award XP
- Diagnostic, quick review, weak-area practice, and timed quiz modes
- Daily flashcard curriculum covering the bank over 24 days, followed by six review days; shuffled and due decks remain available
- Original multi-paragraph reading, paired opinions, and information-retrieval exercises
- Balanced mixed quizzes and Japanese-only quiz controls, questions, and feedback
- Mistake log with filters and corrected status
- Local progress storage with corrupted-data recovery
- JSON content import, CSV vocabulary import, progress export/import, and reset
- Light and dark themes
- PWA manifest, service worker, offline caching, and update prompt
- GitHub Pages deployment workflow

## Content Validation

```bash
pnpm run validate:content
```

The validator checks duplicate IDs, duplicate choices, missing correct answers, multiple valid kanji readings among choices, broken content references, quiz-facing English, empty explanations, required fields, difficulty values, and minimum starter content counts. These structural checks do not replace expert editorial review of every item.

Existing answers, flashcard reviews, settings, and XP evidence remain in the original browser storage key. Old five-day task checkmarks are retained but do not count toward the new campaign. Reviews follow the selected study day. Daily task checkboxes are self-reported; skill accuracy uses the latest attempt per question (up to 50 unique questions per skill), not task completion.

The interface, flashcard presentation, notifications, and question feedback are Japanese-only. English source glosses remain in the bundled data for backward compatibility but are not displayed. Context questions do not show collocations or answer hints; 70 vocabulary and 40 grammar contexts use curated alternatives. Reading questions use passage-specific distractors and kanji readings use closer kana alternatives. The 320 stroke-count questions are retained as historical references but excluded from new sessions (931 active questions).

Progress has no 30-day expiration. On a new local calendar day, the study day advances up to day 30 while answers, reviews, XP, completed tasks, and daily history remain intact. The daily goal counter resets because it represents today's work; previous achievements appear in the daily history. Legacy saves infer the date from the latest recorded activity and retain their existing version and IDs. When legacy saves contain no dated activity, migration starts the date anchor today without changing their selected day.

Saves keep a separate previous-good backup. Unreadable primary data is retained under a recovery key before replacement, and failed writes show a Japanese warning. Storage is local to the same browser, profile, device, and site origin; it is not cloud synchronization. Use Settings' progress export/import before changing devices or clearing browser data. Clearing site data also clears these local backups.

## Bundled Study Bank

The app includes roughly one thousand cumulative N2-prep kanji cards, 200+ vocabulary cards, 60+ grammar cards, and an expanded quiz bank. The broad kanji flashcard bank is generated from public kanjiapi.dev JLPT buckets and bundled locally so the app still works offline after deployment. The script is:

```bash
node scripts/generate-expanded-kanji.mjs
```

The original quiz prompts and explanations in this app are JLPT-style practice material, not official JLPT questions.

## GitHub Pages Deployment

Push to the `main` branch. The included workflow builds and deploys `dist`.

Repository site:

```text
https://USERNAME.github.io/REPOSITORY/
```

User site:

```text
https://USERNAME.github.io/
```

The Vite base path is detected from `GITHUB_REPOSITORY` in GitHub Actions. To override it manually, set:

```bash
VITE_BASE_PATH=/REPOSITORY/ pnpm run build
```

For a user site, use:

```bash
VITE_BASE_PATH=/ pnpm run build
```

The app uses hash-free client rendering and a service worker navigation fallback, so reloading on GitHub Pages should not require server-side routes.

## Installing The App

iPhone:

1. Open the deployed site in Safari.
2. Tap Share.
3. Tap Add to Home Screen.

Desktop Chrome or Edge:

1. Open the deployed site.
2. Click the install icon in the address bar when available.
3. Confirm installation.

## Importing Content

Use Settings to import:

- Study content JSON shaped like `{ "kanji": [], "vocabulary": [], "grammar": [], "questions": [] }`
- Vocabulary CSV with at least `word,reading,meaning`

Invalid files show a readable validation error instead of crashing.

## Progress Storage And Backup

Progress is stored in browser `localStorage` with a version number. Use Settings -> Export all progress to back up answers, mistakes, review status, theme, setup, and imported content. Use Settings -> Import progress JSON to restore.

## Known Limitations

- The starter content is useful for a five-day cram workflow, but it is not a complete N2 curriculum.
- Listening is not included beyond the app architecture being able to accept imported questions.
- The app ranks risk areas and readiness trends; it does not predict official JLPT scores or guarantee a pass.
