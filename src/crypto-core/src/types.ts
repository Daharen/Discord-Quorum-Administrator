export interface CanonicalPayload {
  actionType: string;
  sessionId: string;
  timestamp: number;
  nonce: string;
  payload: unknown;
  policyVersion: number;
}

export interface SignatureEnvelope {
  payloadHash: string;
  publicKey: string;
  signature: string;
}
