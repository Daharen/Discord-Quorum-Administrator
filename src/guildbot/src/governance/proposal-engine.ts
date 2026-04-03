import { canonicalizePayload, generateNonce, sha256 } from "../../../crypto-core/src/index.js";
import type { Clock } from "../util/clock.js";
import { generateProposalId } from "../util/ids.js";
import type { Logger } from "../util/logger.js";
import type {
  GovernanceActionPayload,
  ProposalRecord,
  ProposalStatus,
  SignedGovernanceEvent,
  VoteRecord,
  VoteValue,
} from "../types.js";
import { AuditLog } from "./audit-log.js";
import { NoopCustodySyncPublisher, type CustodySyncPublisher } from "./custody-sync.js";
import { GovernanceEventEmitter } from "./event-emitter.js";
import { ProposalStore } from "./proposal-store.js";
import { evaluateQuorum } from "./quorum-evaluator.js";
import { VoteRegistry } from "./vote-registry.js";

export interface GovernanceRules {
  quorumNumerator: number;
  quorumDenominator: number;
  proposalTtlSeconds: number;
}

export interface CreateProposalInput {
  guildId: string;
  channelId: string;
  proposerDiscordUserId: string;
  proposerMessageId?: string;
  action: GovernanceActionPayload;
}

export interface CastVoteInput {
  proposalId: string;
  voterDiscordUserId: string;
  value: VoteValue;
  eligibleVoterIds: string[];
}

export class ProposalEngine {
  constructor(
    private readonly rules: GovernanceRules,
    private readonly clock: Clock,
    private readonly store: ProposalStore,
    private readonly voteRegistry: VoteRegistry,
    private readonly eventEmitter: GovernanceEventEmitter,
    private readonly auditLog: AuditLog,
    private readonly logger: Logger,
    private readonly custodySync: CustodySyncPublisher = new NoopCustodySyncPublisher(logger),
  ) {}

  async createProposal(input: CreateProposalInput): Promise<{ proposal: ProposalRecord; event: SignedGovernanceEvent }> {
    const createdAtMs = this.clock.nowMs();
    const record: ProposalRecord = {
      proposalId: generateProposalId(),
      guildId: input.guildId,
      channelId: input.channelId,
      proposerDiscordUserId: input.proposerDiscordUserId,
      proposerMessageId: input.proposerMessageId,
      createdAtMs,
      expiresAtMs: createdAtMs + this.rules.proposalTtlSeconds * 1_000,
      nonce: generateNonce(),
      status: "open",
      action: input.action,
      actionPayloadHash: sha256(canonicalizePayload(input.action)),
    };

    this.store.createProposal(record);
    const event = this.emitAndAudit("proposal_created", record.guildId, record.proposalId, input.proposerDiscordUserId, {
      proposal: record,
    });
    await this.custodySync.publishGovernanceEvent(event);
    return { proposal: record, event };
  }

  async castVote(input: CastVoteInput): Promise<{ vote: VoteRecord; status: ProposalStatus }> {
    const proposal = this.requireProposal(input.proposalId);
    const vote = this.voteRegistry.castVote({
      proposalId: input.proposalId,
      voterDiscordUserId: input.voterDiscordUserId,
      castAtMs: this.clock.nowMs(),
      value: input.value,
      eligibleVoterIds: input.eligibleVoterIds,
      proposalStatus: proposal.status,
    });

    this.emitAndAudit("vote_recorded", proposal.guildId, proposal.proposalId, input.voterDiscordUserId, {
      vote,
    });

    const resolved = await this.maybeResolveProposal(input.proposalId, input.eligibleVoterIds);
    return { vote, status: resolved.status };
  }

  async expireOpenProposals(nowMs = this.clock.nowMs()): Promise<ProposalRecord[]> {
    const expired: ProposalRecord[] = [];
    for (const proposal of this.store.listOpenProposals()) {
      if (proposal.expiresAtMs <= nowMs) {
        this.store.updateProposalStatus(proposal.proposalId, "expired", "proposal_ttl_elapsed");
        const event = this.emitAndAudit("proposal_resolved", proposal.guildId, proposal.proposalId, undefined, {
          status: "expired",
          reason: "proposal_ttl_elapsed",
        });
        await this.custodySync.publishGovernanceEvent(event);
        expired.push(proposal);
      }
    }
    return expired;
  }

  async maybeResolveProposal(proposalId: string, eligibleVoterIds: string[]): Promise<ProposalRecord> {
    const proposal = this.requireProposal(proposalId);
    if (proposal.status !== "open") {
      return proposal;
    }

    if (this.clock.nowMs() >= proposal.expiresAtMs) {
      this.store.updateProposalStatus(proposalId, "expired", "proposal_ttl_elapsed");
      const event = this.emitAndAudit("proposal_resolved", proposal.guildId, proposal.proposalId, undefined, {
        status: "expired",
        reason: "proposal_ttl_elapsed",
      });
      await this.custodySync.publishGovernanceEvent(event);
      return proposal;
    }

    const votes = this.voteRegistry.listVotesForProposal(proposalId);
    const yesVoterIds = votes.filter((vote) => vote.value === "yes").map((vote) => vote.voterDiscordUserId);
    const noVoterIds = votes.filter((vote) => vote.value === "no").map((vote) => vote.voterDiscordUserId);
    const quorum = evaluateQuorum({
      eligibleVoterIds,
      yesVoterIds,
      noVoterIds,
      numerator: this.rules.quorumNumerator,
      denominator: this.rules.quorumDenominator,
    });

    if (quorum.approvalReached) {
      this.store.updateProposalStatus(proposalId, "approved", "quorum_approved");
      const event = this.emitAndAudit("proposal_resolved", proposal.guildId, proposalId, undefined, {
        status: "approved",
        reason: "quorum_approved",
        quorum,
      });
      await this.custodySync.publishGovernanceEvent(event);
    } else if (quorum.rejectionReached) {
      this.store.updateProposalStatus(proposalId, "rejected", "quorum_rejected");
      const event = this.emitAndAudit("proposal_resolved", proposal.guildId, proposalId, undefined, {
        status: "rejected",
        reason: "quorum_rejected",
        quorum,
      });
      await this.custodySync.publishGovernanceEvent(event);
    }

    return proposal;
  }

  async executeApprovedProposal(proposalId: string): Promise<ProposalRecord> {
    const proposal = this.requireProposal(proposalId);
    if (proposal.status === "executed") {
      return proposal;
    }
    if (proposal.status !== "approved") {
      throw new Error(`Proposal ${proposalId} status ${proposal.status} cannot execute`);
    }
    if (this.clock.nowMs() >= proposal.expiresAtMs) {
      throw new Error(`Proposal ${proposalId} is expired and cannot execute`);
    }

    // TODO: Apply real Discord role mutation for admin_add/admin_remove actions.
    // TODO: Publish execution side effects to custody-api once networking is implemented.

    this.store.markExecuted(proposalId, this.clock.nowMs());
    const event = this.emitAndAudit("proposal_executed", proposal.guildId, proposalId, undefined, {
      status: "executed",
      actionType: proposal.action.actionType,
    });
    await this.custodySync.publishGovernanceEvent(event);
    this.logger.info("Proposal executed", { proposalId, actionType: proposal.action.actionType });
    return proposal;
  }

  getProposal(proposalId: string): ProposalRecord | undefined {
    return this.store.getProposal(proposalId);
  }

  listOpenProposals(): ProposalRecord[] {
    return this.store.listOpenProposals();
  }

  listVotesForProposal(proposalId: string): VoteRecord[] {
    return this.voteRegistry.listVotesForProposal(proposalId);
  }

  private requireProposal(proposalId: string): ProposalRecord {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Unknown proposal ${proposalId}`);
    }
    return proposal;
  }

  private emitAndAudit(
    eventType: "proposal_created" | "vote_recorded" | "proposal_resolved" | "proposal_executed",
    guildId: string,
    proposalId: string | undefined,
    actorDiscordUserId: string | undefined,
    payload: Record<string, unknown>,
  ): SignedGovernanceEvent {
    const event = this.eventEmitter.emit({
      eventType,
      issuedAtMs: this.clock.nowMs(),
      guildId,
      proposalId,
      actorDiscordUserId,
      payload,
    });
    this.auditLog.append(event, this.clock.nowMs());
    return event;
  }
}
