import type { Rating, ReviewState } from "../../types";

export function scheduleReview(state: ReviewState | undefined, contentId: string, currentDay: number, rating: Rating): ReviewState {
  const repetitions = Math.min(state?.seenCount ?? 0, 4);
  const interval = rating === "again" ? 0 : rating === "hard" ? 1 : rating === "good" ? 2 ** repetitions : 2 ** (repetitions + 1);
  return {
    contentId,
    dueDay: currentDay + interval,
    lastRating: rating,
    seenCount: (state?.seenCount ?? 0) + 1
  };
}

export function dueReviewIds(review: ReviewState[], currentDay: number): string[] {
  return review.filter((item) => item.dueDay <= currentDay).map((item) => item.contentId);
}
