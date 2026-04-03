import type { ProposalEngine } from "./proposal-engine.js";
import type { GovernanceActionPayload, VoteValue } from "../types.js";

export interface CommandContext {
  guildId: string;
  channelId: string;
  authorId: string;
  messageId: string;
  eligibleAdminIds: string[];
}

export class GovernanceCommandHandlers {
  constructor(
    private readonly engine: ProposalEngine,
    private readonly quorumNumerator: number,
    private readonly quorumDenominator: number,
  ) {}

  async handlePropose(context: CommandContext, action: GovernanceActionPayload): Promise<string> {
    if (!context.eligibleAdminIds.includes(context.authorId)) {
      throw new Error("Only admin-role holders can create proposals");
    }

    const { proposal } = await this.engine.createProposal({
      guildId: context.guildId,
      channelId: context.channelId,
      proposerDiscordUserId: context.authorId,
      proposerMessageId: context.messageId,
      action,
    });

    return `Created proposal ${proposal.proposalId} (${action.actionType}) target=${action.targetDiscordUserId ?? "n/a"} expires=${new Date(proposal.expiresAtMs).toISOString()} quorum=${this.quorumNumerator}/${this.quorumDenominator}`;
  }

  async handleVote(context: CommandContext, proposalId: string, value: VoteValue): Promise<string> {
    if (!context.eligibleAdminIds.includes(context.authorId)) {
      throw new Error("Only admin-role holders can vote");
    }

    const result = await this.engine.castVote({
      proposalId,
      voterDiscordUserId: context.authorId,
      value,
      eligibleVoterIds: context.eligibleAdminIds,
    });

    const votes = this.engine.listVotesForProposal(proposalId);
    const yes = votes.filter((vote) => vote.value === "yes").length;
    const no = votes.filter((vote) => vote.value === "no").length;
    return `Vote recorded immutably for ${proposalId}: ${value}. Tally yes=${yes} no=${no}. Status=${result.status}.`;
  }

  async handleProposal(proposalId: string): Promise<string> {
    const proposal = this.engine.getProposal(proposalId);
    if (!proposal) {
      return `Unknown proposal ${proposalId}`;
    }
    return `Proposal ${proposalId}: status=${proposal.status} action=${proposal.action.actionType} proposer=${proposal.proposerDiscordUserId} expires=${new Date(proposal.expiresAtMs).toISOString()}`;
  }

  async handleProposals(): Promise<string> {
    const open = this.engine.listOpenProposals();
    if (open.length === 0) return "No open proposals.";
    return open
      .map((proposal) => `${proposal.proposalId} ${proposal.action.actionType} expires=${new Date(proposal.expiresAtMs).toISOString()}`)
      .join("\n");
  }

  async handleExpire(nowMs: number): Promise<string> {
    const expired = await this.engine.expireOpenProposals(nowMs);
    return `Expired ${expired.length} proposals.`;
  }

  async handleExecute(proposalId: string): Promise<string> {
    const proposal = await this.engine.executeApprovedProposal(proposalId);
    return `Execution receipt: proposal=${proposal.proposalId} status=${proposal.status} executedAt=${proposal.executedAtMs}`;
  }
}
