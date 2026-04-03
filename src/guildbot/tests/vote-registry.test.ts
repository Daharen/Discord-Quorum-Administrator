import { describe, expect, it } from "vitest";
import { VoteRegistry } from "../src/governance/vote-registry.js";

describe("VoteRegistry", () => {
  it("accepts eligible voter", () => {
    const registry = new VoteRegistry();
    const vote = registry.castVote({
      proposalId: "p1",
      voterDiscordUserId: "u1",
      castAtMs: 100,
      value: "yes",
      eligibleVoterIds: ["u1", "u2"],
      proposalStatus: "open",
    });

    expect(vote.value).toBe("yes");
  });

  it("rejects duplicate vote", () => {
    const registry = new VoteRegistry();
    registry.castVote({
      proposalId: "p1",
      voterDiscordUserId: "u1",
      castAtMs: 100,
      value: "yes",
      eligibleVoterIds: ["u1", "u2"],
      proposalStatus: "open",
    });

    expect(() =>
      registry.castVote({
        proposalId: "p1",
        voterDiscordUserId: "u1",
        castAtMs: 101,
        value: "no",
        eligibleVoterIds: ["u1", "u2"],
        proposalStatus: "open",
      }),
    ).toThrow(/already voted/);
  });

  it("rejects ineligible voter", () => {
    const registry = new VoteRegistry();
    expect(() =>
      registry.castVote({
        proposalId: "p1",
        voterDiscordUserId: "u9",
        castAtMs: 100,
        value: "yes",
        eligibleVoterIds: ["u1", "u2"],
        proposalStatus: "open",
      }),
    ).toThrow(/not eligible/);
  });

  it("rejects closed proposal vote", () => {
    const registry = new VoteRegistry();
    expect(() =>
      registry.castVote({
        proposalId: "p1",
        voterDiscordUserId: "u1",
        castAtMs: 100,
        value: "yes",
        eligibleVoterIds: ["u1", "u2"],
        proposalStatus: "rejected",
      }),
    ).toThrow(/not open/);
  });
});
