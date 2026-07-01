import type { AnswerRecord, MistakeRecord, QuizQuestion } from "../../types";

export function updateMistakes(existing: MistakeRecord[], answers: AnswerRecord[], questions: QuizQuestion[]): MistakeRecord[] {
  const byId = new Map(existing.map((m) => [m.questionId, { ...m }]));
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;
    const previous = byId.get(answer.questionId);
    if (!answer.correct || answer.confidence === "guess") {
      byId.set(answer.questionId, {
        questionId: answer.questionId,
        category: answer.category,
        subcategory: answer.subcategory,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer,
        firstMissedAt: previous?.firstMissedAt ?? answer.answeredAt,
        lastMissedAt: answer.answeredAt,
        timesMissed: previous ? previous.timesMissed + (answer.correct ? 0 : 1) : answer.correct ? 0 : 1,
        confidence: answer.confidence,
        explanation: question.explanation,
        guessedCorrectly: answer.correct && answer.confidence === "guess",
        corrected: previous?.corrected ?? false,
        correctedAt: previous?.correctedAt
      });
    } else if (previous && !previous.corrected) {
      byId.set(answer.questionId, {
        ...previous,
        corrected: true,
        correctedAt: answer.answeredAt
      });
    }
  }
  return Array.from(byId.values());
}
