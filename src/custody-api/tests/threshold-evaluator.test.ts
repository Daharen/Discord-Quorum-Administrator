import { describe, expect, it } from "vitest";
import { computeRequiredThreshold, thresholdReached } from "../src/domain/threshold-evaluator.js";

describe("threshold evaluator", () => {
  it("computes deterministic threshold", () => {
    expect(computeRequiredThreshold(3, { numerator: 2, denominator: 3 })).toBe(2);
    expect(computeRequiredThreshold(5, { numerator: 3, denominator: 4 })).toBe(4);
    expect(thresholdReached(3, 2)).toBe(false);
    expect(thresholdReached(3, 3)).toBe(true);
  });
});
