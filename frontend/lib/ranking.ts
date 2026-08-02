export type Bucket = "liked" | "ok" | "disliked";

export const BUCKETS: { key: Bucket; label: string; prompt: string }[] = [
  { key: "liked", label: "Liked it", prompt: "What stood out?" },
  { key: "ok", label: "It was ok", prompt: "What worked, what didn't?" },
  { key: "disliked", label: "Didn't like it", prompt: "What went wrong?" },
];

export const TAGS = ["atmosphere", "food_quality", "service"] as const;
export type Tag = (typeof TAGS)[number];

export const TAG_LABELS: Record<Tag, string> = {
  atmosphere: "Atmosphere",
  food_quality: "Food quality",
  service: "Service",
};

const BUCKET_RANGES: Record<Bucket, { min: number; max: number }> = {
  liked: { min: 7.0, max: 10.0 },
  ok: { min: 4.0, max: 6.9 },
  disliked: { min: 0.1, max: 3.9 },
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * score = max - (width * (rank - 1) / (N - 1)), rank=1 is best in the bucket.
 * N === 1 (only item in the bucket) gets the bucket's midpoint.
 */
export function interpolateScore(bucket: Bucket, rank: number, n: number): number {
  if (n <= 0) throw new Error("n must be >= 1");
  if (rank < 1 || rank > n) throw new Error("rank must be within [1, n]");
  const { min, max } = BUCKET_RANGES[bucket];
  if (n === 1) return round1((min + max) / 2);
  const width = max - min;
  return round1(max - (width * (rank - 1)) / (n - 1));
}

export type ComparisonResult = "better" | "worse";

export interface ComparisonState {
  /** 1-indexed lower bound of the still-possible rank range (inclusive) */
  lo: number;
  /** 1-indexed upper bound of the still-possible rank range (inclusive) */
  hi: number;
  comparisons: number;
  lastResult: ComparisonResult | null;
  sameDirectionStreak: number;
  done: boolean;
  /** Set once done: the new restaurant's final 1-indexed rank in the bucket (out of existingCount + 1) */
  finalRank: number | null;
}

const MAX_COMPARISONS = 4;

function midpoint(lo: number, hi: number): number {
  return Math.round((lo + hi) / 2);
}

/** existingCount = how many restaurants this user already has ranked in this bucket. */
export function initComparisonState(existingCount: number): ComparisonState {
  if (existingCount <= 0) {
    return { lo: 1, hi: 0, comparisons: 0, lastResult: null, sameDirectionStreak: 0, done: true, finalRank: 1 };
  }
  return { lo: 1, hi: existingCount, comparisons: 0, lastResult: null, sameDirectionStreak: 0, done: false, finalRank: null };
}

/** Which existing rank (1-indexed) to compare the new restaurant against next. Null if no more comparisons needed. */
export function nextComparisonTarget(state: ComparisonState): number | null {
  if (state.done) return null;
  return midpoint(state.lo, state.hi);
}

export function applyComparisonResult(state: ComparisonState, result: ComparisonResult): ComparisonState {
  if (state.done) return state;

  const mid = midpoint(state.lo, state.hi);
  let { lo, hi } = state;
  if (result === "better") {
    hi = mid - 1;
  } else {
    lo = mid + 1;
  }

  const comparisons = state.comparisons + 1;
  const sameDirectionStreak = result === state.lastResult ? state.sameDirectionStreak + 1 : 1;

  // Range fully resolved: exact insertion point, no ambiguity left.
  if (lo > hi) {
    return { lo, hi, comparisons, lastResult: result, sameDirectionStreak, done: true, finalRank: lo };
  }
  // Early exit (2 consecutive same-direction answers) or max comparisons reached:
  // place at the midpoint of whatever range is still unresolved rather than asking more.
  if (sameDirectionStreak >= 2 || comparisons >= MAX_COMPARISONS) {
    return { lo, hi, comparisons, lastResult: result, sameDirectionStreak, done: true, finalRank: midpoint(lo, hi) };
  }
  return { lo, hi, comparisons, lastResult: result, sameDirectionStreak, done: false, finalRank: null };
}
