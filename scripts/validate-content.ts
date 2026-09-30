import { starterContent } from "../src/data/content";
import { validateContent } from "../src/services/importExport";

const issues = validateContent(starterContent);

if (starterContent.kanji.length < 1000) issues.push({ message: `Expected at least 1000 kanji items, found ${starterContent.kanji.length}.` });
if (starterContent.vocabulary.length !== 6000) issues.push({ message: `Expected 6000 vocabulary items, found ${starterContent.vocabulary.length}.` });
if (starterContent.grammar.length < 60) issues.push({ message: `Expected at least 60 grammar items, found ${starterContent.grammar.length}.` });
if (starterContent.questions.length < 700) issues.push({ message: `Expected at least 700 quiz questions, found ${starterContent.questions.length}.` });

if (issues.length) {
  console.error("Content validation failed:");
  for (const issue of issues) console.error(`- ${issue.message}`);
  process.exit(1);
}

console.log(`Content validation passed: ${starterContent.kanji.length} kanji, ${starterContent.vocabulary.length} vocabulary, ${starterContent.grammar.length} grammar, ${starterContent.questions.length} questions.`);
