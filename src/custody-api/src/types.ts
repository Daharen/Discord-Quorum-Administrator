export type GuildBotEventType =
  | "administrator_promoted"
  | "administrator_removed"
  | "proposal_resolved"
  | "recovery_session_initiated";

export interface CustodianMembershipRecord {
  discordUserId: string;
  status: "active" | "removed";
  policyVersion: number;
  changedAtMs: number;
  sourceEventId: string;
}

export interface CustodianPublicKeyRecord {
  keyId: string;
  discordUserId: string;
  publicKeyB64: string;
  registeredAtMs: number;
  revokedAtMs?: number;
  policyVersion: number;
}

export interface CanonicalSessionPayload {
  actionType: string;
  sessionId: string;
  timestamp: number;
  nonce: string;
  payload: Record<string, unknown>;
  policyVersion: number;
}

export interface CustodySessionApprovalRecord {
  approvalId: string;
  sessionId: string;
  signerDiscordUserId: string;
  signerKeyId: string;
  signatureB64: string;
  approvedAtMs: number;
  policyVersion: number;
}

export interface CustodySessionRecord {
  sessionId: string;
  scope: string;
  createdAtMs: number;
  expiresAtMs: number;
  requiredThreshold: number;
  policyVersion: number;
  canonicalPayloadHash: string;
  canonicalPayload: CanonicalSessionPayload;
  status: "pending" | "authorized" | "expired" | "closed";
  approvals: CustodySessionApprovalRecord[];
}

export interface SignedGuildBotEventEnvelope {
  eventId: string;
  eventType: GuildBotEventType;
  issuedAtMs: number;
  nonce: string;
  guildId: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  publicKey: string;
  signature: string;
}

export interface AuditEntryRecord {
  entryId: string;
  occurredAtMs: number;
  eventType: string;
  entityId: string;
  actor?: string;
  data: Record<string, unknown>;
  previousHash: string;
  entryHash: string;
}
