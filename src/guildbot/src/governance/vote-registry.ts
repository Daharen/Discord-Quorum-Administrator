import type { ProposalStatus, VoteRecord, VoteValue } from "../types.js";

export interface CastVoteInput {
  proposalId: string;
  voterDiscordUserId: string;
  castAtMs: number;
  value: VoteValue;
  eligibleVoterIds: string[];
  proposalStatus: ProposalStatus;
}

export class VoteRegistry {
  private readonly votesByProposal = new Map<string, Map<string, VoteRecord>>();

  castVote(input: CastVoteInput): VoteRecord {
    if (input.proposalStatus !== "open") {
      throw new Error(`Proposal ${input.proposalId} is not open for voting`);
    }

    const eligible = new Set(input.eligibleVoterIds);
    if (!eligible.has(input.voterDiscordUserId)) {
      throw new Error(`Voter ${input.voterDiscordUserId} is not eligible`);
    }

    const proposalVotes = this.votesByProposal.get(input.proposalId) ?? new Map<string, VoteRecord>();
    if (proposalVotes.has(input.voterDiscordUserId)) {
      throw new Error(`Voter ${input.voterDiscordUserId} already voted on ${input.proposalId}`);
    }

    const vote: VoteRecord = {
      proposalId: input.proposalId,
      voterDiscordUserId: input.voterDiscordUserId,
      castAtMs: input.castAtMs,
      value: input.value,
    };

    proposalVotes.set(input.voterDiscordUserId, vote);
    this.votesByProposal.set(input.proposalId, proposalVotes);
    return vote;
  }

  listVotesForProposal(proposalId: string): VoteRecord[] {
    const proposalVotes = this.votesByProposal.get(proposalId);
    if (!proposalVotes) {
      return [];
    }

    return [...proposalVotes.values()].sort((a, b) => a.castAtMs - b.castAtMs || a.voterDiscordUserId.localeCompare(b.voterDiscordUserId));
  }
}
