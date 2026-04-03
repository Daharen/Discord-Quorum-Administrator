import type { ProposalRecord, ProposalStatus } from "../types.js";

export class ProposalStore {
  private readonly proposals = new Map<string, ProposalRecord>();

  createProposal(record: ProposalRecord): ProposalRecord {
    if (this.proposals.has(record.proposalId)) {
      throw new Error(`Proposal ${record.proposalId} already exists`);
    }

    this.proposals.set(record.proposalId, record);
    return record;
  }

  getProposal(proposalId: string): ProposalRecord | undefined {
    return this.proposals.get(proposalId);
  }

  listOpenProposals(): ProposalRecord[] {
    return [...this.proposals.values()].filter((proposal) => proposal.status === "open");
  }

  updateProposalStatus(proposalId: string, status: ProposalStatus, reason?: string): ProposalRecord {
    const proposal = this.requireProposal(proposalId);
    proposal.status = status;
    proposal.resolutionReason = reason;
    return proposal;
  }

  markExecuted(proposalId: string, executedAtMs: number): ProposalRecord {
    const proposal = this.requireProposal(proposalId);
    proposal.status = "executed";
    proposal.executedAtMs = executedAtMs;
    return proposal;
  }

  private requireProposal(proposalId: string): ProposalRecord {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Unknown proposal ${proposalId}`);
    }
    return proposal;
  }
}
