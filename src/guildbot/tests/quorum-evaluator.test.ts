import { describe, expect, it } from "vitest";
import { evaluateQuorum } from "../src/governance/quorum-evaluator.js";

describe("evaluateQuorum", () => {
  it("requires quorum greater than one", () => {
    const result = evaluateQuorum({
      eligibleVoterIds: ["a", "b"],
      yesVoterIds: ["a"],
      noVoterIds: [],
      numerator: 1,
      denominator: 2,
    });

    expect(result.requiredYesVotes).toBe(2);
    expect(result.approvalReached).toBe(false);
  });

  it("rounds supermajority deterministically", () => {
    const result = evaluateQuorum({
      eligibleVoterIds: ["a", "b", "c", "d", "e"],
      yesVoterIds: ["a", "b", "c", "d"],
      noVoterIds: [],
      numerator: 2,
      denominator: 3,
    });

    expect(result.requiredYesVotes).toBe(4);
    expect(result.approvalReached).toBe(true);
  });

  it("detects deterministic rejection", () => {
    const result = evaluateQuorum({
      eligibleVoterIds: ["a", "b", "c", "d", "e"],
      yesVoterIds: ["a"],
      noVoterIds: ["b", "c"],
      numerator: 2,
      denominator: 3,
    });

    expect(result.requiredYesVotes).toBe(4);
    expect(result.rejectionReached).toBe(true);
  });
});
