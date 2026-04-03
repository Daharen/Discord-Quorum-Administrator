import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateKeyPair } from "crypto-core";
import { AuditLog } from "../src/governance/audit-log.js";
import { GovernanceEventEmitter } from "../src/governance/event-emitter.js";
import { ProposalEngine } from "../src/governance/proposal-engine.js";
import { ProposalStore } from "../src/governance/proposal-store.js";
import { VoteRegistry } from "../src/governance/vote-registry.js";
import type { Clock } from "../src/util/clock.js";
import { ConsoleLogger } from "../src/util/logger.js";

class FakeClock implements Clock {
  constructor(private now: number) {}
  nowMs(): number {
    return this.now;
  }
  set(now: number): void {
    this.now = now;
  }
}

const paths: string[] = [];
afterEach(() => {
  while (paths.length > 0) {
    const dir = paths.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function createEngine(clock: FakeClock): ProposalEngine {
  const { privateKey, publicKey } = generateKeyPair();
  const dir = mkdtempSync(join(tmpdir(), "guildbot-test-"));
  paths.push(dir);
  return new ProposalEngine(
    { quorumNumerator: 2, quorumDenominator: 3, proposalTtlSeconds: 100 },
    clock,
    new ProposalStore(),
    new VoteRegistry(),
    new GovernanceEventEmitter(privateKey, publicKey),
    new AuditLog(join(dir, "governance.ndjson")),
    new ConsoleLogger("test"),
  );
}

describe("ProposalEngine", () => {
  it("sets nonce and expiration on creation", async () => {
    const clock = new FakeClock(1000);
    const engine = createEngine(clock);

    const { proposal } = await engine.createProposal({
      guildId: "g1",
      channelId: "c1",
      proposerDiscordUserId: "u1",
      action: { actionType: "admin_add", targetDiscordUserId: "u2" },
    });

    expect(proposal.nonce).toHaveLength(32);
    expect(proposal.expiresAtMs).toBe(101000);
  });

  it("approves when quorum reached", async () => {
    const engine = createEngine(new FakeClock(1000));
    const { proposal } = await engine.createProposal({
      guildId: "g1",
      channelId: "c1",
      proposerDiscordUserId: "u1",
      action: { actionType: "admin_add", targetDiscordUserId: "u2" },
    });

    await engine.castVote({ proposalId: proposal.proposalId, voterDiscordUserId: "u1", value: "yes", eligibleVoterIds: ["u1", "u2", "u3"] });
    await engine.castVote({ proposalId: proposal.proposalId, voterDiscordUserId: "u2", value: "yes", eligibleVoterIds: ["u1", "u2", "u3"] });

    expect(engine.getProposal(proposal.proposalId)?.status).toBe("approved");
  });

  it("rejects when quorum unreachable", async () => {
    const engine = createEngine(new FakeClock(1000));
    const { proposal } = await engine.createProposal({
      guildId: "g1",
      channelId: "c1",
      proposerDiscordUserId: "u1",
      action: { actionType: "admin_add", targetDiscordUserId: "u2" },
    });

    await engine.castVote({ proposalId: proposal.proposalId, voterDiscordUserId: "u1", value: "no", eligibleVoterIds: ["u1", "u2", "u3"] });
    await engine.castVote({ proposalId: proposal.proposalId, voterDiscordUserId: "u2", value: "no", eligibleVoterIds: ["u1", "u2", "u3"] });

    expect(engine.getProposal(proposal.proposalId)?.status).toBe("rejected");
  });

  it("expires unresolved proposals", async () => {
    const clock = new FakeClock(1000);
    const engine = createEngine(clock);
    const { proposal } = await engine.createProposal({
      guildId: "g1",
      channelId: "c1",
      proposerDiscordUserId: "u1",
      action: { actionType: "admin_add", targetDiscordUserId: "u2" },
    });

    clock.set(101000);
    await engine.expireOpenProposals(clock.nowMs());
    expect(engine.getProposal(proposal.proposalId)?.status).toBe("expired");
  });

  it("executes approved proposal once only", async () => {
    const engine = createEngine(new FakeClock(1000));
    const { proposal } = await engine.createProposal({
      guildId: "g1",
      channelId: "c1",
      proposerDiscordUserId: "u1",
      action: { actionType: "admin_add", targetDiscordUserId: "u2" },
    });
    await engine.castVote({ proposalId: proposal.proposalId, voterDiscordUserId: "u1", value: "yes", eligibleVoterIds: ["u1", "u2", "u3"] });
    await engine.castVote({ proposalId: proposal.proposalId, voterDiscordUserId: "u2", value: "yes", eligibleVoterIds: ["u1", "u2", "u3"] });

    await engine.executeApprovedProposal(proposal.proposalId);
    const second = await engine.executeApprovedProposal(proposal.proposalId);
    expect(second.status).toBe("executed");
  });
});
