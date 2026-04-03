import { generateNonce, sha256 } from "../../../crypto-core/src/index.js";

export function generateProposalId(): string {
  return `prop_${generateNonce().slice(0, 20)}`;
}

export function deriveEventId(payloadHash: string, signature: string): string {
  return `evt_${sha256(`${payloadHash}:${signature}`).slice(0, 24)}`;
}
