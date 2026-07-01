import type { Rating, ReviewState } from "../../types";

export function scheduleReview(state: ReviewState | undefined, contentId: string, currentDay: number, rating: Rating): ReviewState {
  const interval = rating === "again" ? 0 : rating === "hard" ? 1 : rating === "good" ? 1 : 2;
  return {
    contentId,
    dueDay: Math.min(5, Math.max(currentDay, currentDay + interval)),
    lastRating: rating,
    seenCount: (state?.seenCount ?? 0) + 1
  };
}

export function dueReviewIds(review: ReviewState[], currentDay: number): string[] {
  return review.filter((item) => item.dueDay <= currentDay).map((item) => item.contentId);
}
