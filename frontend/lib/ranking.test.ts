import { describe, it, expect } from "vitest";
import {
  interpolateScore,
  initComparisonState,
  nextComparisonTarget,
  applyComparisonResult,
} from "./ranking";

describe("interpolateScore", () => {
  it("assigns the bucket midpoint when it's the only item (N=1)", () => {
    expect(interpolateScore("liked", 1, 1)).toBe(8.5); // (7.0 + 10.0) / 2
    expect(interpolateScore("ok", 1, 1)).toBe(5.5); // (4.0 + 6.9) / 2 = 5.45, rounded to 1dp
    expect(interpolateScore("disliked", 1, 1)).toBe(2.0);
  });

  it("assigns the max of the range to rank 1 in a multi-item bucket", () => {
    expect(interpolateScore("liked", 1, 4)).toBe(10.0);
  });

  it("assigns the min of the range to the last rank", () => {
    expect(interpolateScore("liked", 4, 4)).toBe(7.0);
  });

  it("interpolates linearly for middle ranks", () => {
    // N=4, width=3: rank2 -> 10 - 3*(1/3) = 9.0, rank3 -> 10 - 3*(2/3) = 8.0
    expect(interpolateScore("liked", 2, 4)).toBe(9.0);
    expect(interpolateScore("liked", 3, 4)).toBe(8.0);
  });

  it("throws on out-of-range rank", () => {
    expect(() => interpolateScore("liked", 0, 4)).toThrow();
    expect(() => interpolateScore("liked", 5, 4)).toThrow();
  });

  it("throws on n <= 0", () => {
    expect(() => interpolateScore("liked", 1, 0)).toThrow();
  });
});

describe("comparison state machine", () => {
  it("skips comparison entirely when the bucket is empty", () => {
    const state = initComparisonState(0);
    expect(state.done).toBe(true);
    expect(state.finalRank).toBe(1);
    expect(nextComparisonTarget(state)).toBeNull();
  });

  it("does exactly one comparison when the bucket has exactly 1 entry (better)", () => {
    let state = initComparisonState(1);
    expect(nextComparisonTarget(state)).toBe(1);
    state = applyComparisonResult(state, "better");
    expect(state.done).toBe(true);
    expect(state.comparisons).toBe(1);
    expect(state.finalRank).toBe(1); // new restaurant beats the only existing one -> rank 1
  });

  it("does exactly one comparison when the bucket has exactly 1 entry (worse)", () => {
    let state = initComparisonState(1);
    state = applyComparisonResult(state, "worse");
    expect(state.done).toBe(true);
    expect(state.finalRank).toBe(2); // new restaurant loses -> rank 2 (after the existing one)
  });

  it("runs a true binary search over 8 existing entries, resolving exactly within 4 comparisons", () => {
    // Existing ranks 1..8. Simulate the new restaurant belongs at rank 6
    // (i.e. it's worse than ranks 1-5, better than ranks 6-8... simulate answers accordingly)
    let state = initComparisonState(8);
    // mid = round((1+8)/2) = 5 -> worse than rank 5 -> lo=6,hi=8
    expect(nextComparisonTarget(state)).toBe(5);
    state = applyComparisonResult(state, "worse");
    expect(state.done).toBe(false);
    // mid = round((6+8)/2) = 7 -> better than rank 7 -> hi=6, lo=6
    expect(nextComparisonTarget(state)).toBe(7);
    state = applyComparisonResult(state, "better");
    // lo=6, hi=6 -> not yet lo>hi, streak=1 (worse then better = different direction, streak resets to 1)
    expect(state.done).toBe(false);
    expect(nextComparisonTarget(state)).toBe(6);
    state = applyComparisonResult(state, "worse");
    // lo=7, hi=6 -> lo>hi -> resolved exactly
    expect(state.done).toBe(true);
    expect(state.comparisons).toBe(3);
    expect(state.finalRank).toBe(7);
  });

  it("stops after 2 consecutive same-direction answers (early exit) instead of continuing to narrow", () => {
    let state = initComparisonState(8);
    expect(nextComparisonTarget(state)).toBe(5);
    state = applyComparisonResult(state, "worse"); // lo=6,hi=8, streak=1
    expect(state.done).toBe(false);
    expect(nextComparisonTarget(state)).toBe(7);
    state = applyComparisonResult(state, "worse"); // lo=8,hi=8, streak=2 -> early exit
    expect(state.done).toBe(true);
    expect(state.comparisons).toBe(2);
    expect(state.finalRank).toBe(8); // midpoint of remaining [8,8]
  });

  it("never exceeds 4 comparisons even if the range never resolves and directions alternate", () => {
    let state = initComparisonState(100);
    let toggle: "better" | "worse" = "worse";
    for (let i = 0; i < 4 && !state.done; i++) {
      expect(nextComparisonTarget(state)).not.toBeNull();
      state = applyComparisonResult(state, toggle);
      toggle = toggle === "worse" ? "better" : "worse"; // alternate to avoid triggering early exit
    }
    expect(state.done).toBe(true);
    expect(state.comparisons).toBeLessThanOrEqual(4);
    expect(state.finalRank).not.toBeNull();
  });

  it("every comparison target stays within the bucket's existing count", () => {
    let state = initComparisonState(5);
    let guard = 0;
    while (!state.done && guard < 10) {
      const target = nextComparisonTarget(state);
      expect(target).not.toBeNull();
      expect(target as number).toBeGreaterThanOrEqual(1);
      expect(target as number).toBeLessThanOrEqual(5);
      state = applyComparisonResult(state, "worse");
      guard++;
    }
    expect(state.done).toBe(true);
  });
});
