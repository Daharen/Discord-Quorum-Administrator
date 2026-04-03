export interface ThresholdPolicy {
  numerator: number;
  denominator: number;
}

export function computeRequiredThreshold(activeCustodians: number, policy: ThresholdPolicy): number {
  if (policy.numerator <= 1) {
    throw new Error("Threshold numerator must be greater than one");
  }
  if (policy.denominator <= policy.numerator) {
    throw new Error("Threshold denominator must be greater than numerator");
  }
  if (activeCustodians <= 1) {
    return 2;
  }
  const required = Math.ceil((activeCustodians * policy.numerator) / policy.denominator);
  return Math.max(2, Math.min(activeCustodians, required));
}

export function thresholdReached(requiredThreshold: number, uniqueApprovals: number): boolean {
  return uniqueApprovals >= requiredThreshold;
}
