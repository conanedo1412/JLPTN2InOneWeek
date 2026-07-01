# JLPT N2 Five-Day Intensive

A lightweight offline-first React PWA for someone who is already close to passing JLPT N2 and has five serious preparation days left. It focuses on kanji, vocabulary, grammar distinctions, sentence ordering, timed mixed practice, and personal mistake recovery.

The bundled questions are original JLPT-style practice material. They are not official JLPT questions and are not copied from commercial prep books.

## Requirements

- Node.js 22 or newer
- npm

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
- Five-day adaptive study plan
- Diagnostic, quick review, weak-area practice, and timed quiz modes
- Flashcard learn mode with simple cram-friendly scheduling
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

The validator checks duplicate IDs, duplicate choices, missing correct answers, broken content references, empty explanations, required fields, difficulty values, and minimum starter content counts.

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
