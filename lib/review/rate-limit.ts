// A simple sliding-window limiter, kept in memory. It resets when the server restarts
// and is per server instance, which is fine for a demo. Move it to the database before
// relying on it at scale.

export const REVIEW_LIMIT = 5;
export const REVIEW_WINDOW_MS = 60 * 60 * 1000;

const hits = new Map<string, number[]>();

export type LimitResult = { allowed: true; remaining: number } | { allowed: false; retryAfterSec: number };

export function takeReviewSlot(userId: string, now = Date.now()): LimitResult {
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < REVIEW_WINDOW_MS);
  if (recent.length >= REVIEW_LIMIT) {
    hits.set(userId, recent);
    return { allowed: false, retryAfterSec: Math.ceil((recent[0] + REVIEW_WINDOW_MS - now) / 1000) };
  }
  recent.push(now);
  hits.set(userId, recent);
  return { allowed: true, remaining: REVIEW_LIMIT - recent.length };
}

// For tests.
export function resetReviewLimits() {
  hits.clear();
}
