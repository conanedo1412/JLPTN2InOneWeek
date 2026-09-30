# Expanded Vocabulary

The bank contains 6,000 entries: the original 248 entries, unchanged, and 5,752 additional common dictionary headwords. This is a general study vocabulary expansion, not an official JLPT N2 word list or a claim that all entries are N2-level.

## Sources and Licenses

- Readings and common-word flags: JMdict, copyright Electronic Dictionary Research and Development Group, via [jmdict-simplified](https://github.com/scriptin/jmdict-simplified), release `3.6.2+20260928191014`, common English archive. Data is CC BY-SA 4.0; license included at `public/licenses/jmdict.txt`. Derived `src/data/expandedVocabulary.json` is distributed under CC BY-SA 4.0, with the Japanese WordNet notices also retained.
- Japanese definitions: [Japanese WordNet 1.1](https://bond-lab.github.io/wnja/jpn/downloads.html). Copyright 2009-2011 NICT, 2012-2015 Francis Bond, 2016-2024 Francis Bond and Takayuki Kuribayashi. Permissive terms included at `public/licenses/japanese-wordnet.txt`.

Only common, non-obsolete headwords with a manually linked WordNet sense and matching JMdict English gloss / WordNet English synonym are selected. English is used only during alignment, not displayed in the app. Reading and spelling restrictions are respected. Entries retain JMdict IDs and WordNet synset IDs for traceability. Selection prioritizes earlier dictionary senses and uses a stable hash to avoid truncating the alphabet. Source data can still contain errors; these entries have not all been manually reviewed.

No example sentences are fabricated: expanded entries display the sourced Japanese definition and reading. Existing authored examples remain. Reading quizzes exclude every reading found for the spelling in the common JMdict source, including alternative entries and kana-script equivalents. Choices are precomputed, not ranked on each app load.

## Reproduction

1. Download `https://github.com/bond-lab/wnja/releases/download/v1.1/wnjpn.db.gz` and decompress to `work/wnjpn.db`.
2. Download `https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2%2B20260928191014/jmdict-eng-common-3.6.2%2B20260928191014.json.zip` and extract to `work/jmdict-common/`.
3. With Node 24, run `node --import tsx scripts/generate-expanded-vocabulary.ts`.
4. Run `pnpm test` and `pnpm run build`.

Do not renumber existing IDs. The app retains the original storage key and backup format. Dictionary archives are build-time inputs only; the generated bank is bundled for offline use.
