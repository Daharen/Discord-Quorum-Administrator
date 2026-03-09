import { canonicalizePayload } from "./canonicalize.js";
import { sha256 } from "./hash.js";
import { generateNonce } from "./nonce.js";
import type { CanonicalPayload } from "./types.js";

export function createPayload(
  actionType: string,
  sessionId: string,
  payload: unknown,
  policyVersion = 1,
): CanonicalPayload {
  return {
    actionType,
    sessionId,
    timestamp: Date.now(),
    nonce: generateNonce(),
    payload,
    policyVersion,
  };
}

export function serializePayload(payload: CanonicalPayload): string {
  return canonicalizePayload(payload);
}

export function hashPayload(payload: CanonicalPayload): string {
  return sha256(serializePayload(payload));
}
