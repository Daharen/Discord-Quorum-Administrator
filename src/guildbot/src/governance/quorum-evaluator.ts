export interface QuorumEvaluationInput {
  eligibleVoterIds: string[];
  yesVoterIds: string[];
  noVoterIds: string[];
  numerator: number;
  denominator: number;
}

export interface QuorumEvaluationResult {
  requiredYesVotes: number;
  totalEligibleVoters: number;
  approvalReached: boolean;
  rejectionReached: boolean;
}

export function evaluateQuorum(input: QuorumEvaluationInput): QuorumEvaluationResult {
  const totalEligibleVoters = new Set(input.eligibleVoterIds).size;
  const yesVotes = new Set(input.yesVoterIds).size;
  const noVotes = new Set(input.noVoterIds).size;

  const requiredYesVotes = Math.max(2, Math.ceil((totalEligibleVoters * input.numerator) / input.denominator));
  const remainingPossibleYesVotes = totalEligibleVoters - noVotes - yesVotes;

  return {
    requiredYesVotes,
    totalEligibleVoters,
    approvalReached: yesVotes >= requiredYesVotes,
    rejectionReached: yesVotes + Math.max(0, remainingPossibleYesVotes) < requiredYesVotes,
  };
}
