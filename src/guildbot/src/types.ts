export type ProposalStatus = "open" | "approved" | "rejected" | "expired" | "executed";

export type VoteValue = "yes" | "no";

export type GovernanceActionType =
  | "admin_add"
  | "admin_remove"
  | "governance_config_update"
  | "recovery_session_initiate"
  | "administrative_action";

export interface GovernanceActionPayload {
  actionType: GovernanceActionType;
  targetDiscordUserId?: string;
  configPatch?: Record<string, unknown>;
  administrativeAction?: {
    actionName: string;
    parameters: Record<string, unknown>;
  };
}

export interface ProposalRecord {
  proposalId: string;
  guildId: string;
  channelId: string;
  proposerDiscordUserId: string;
  proposerMessageId?: string;
  createdAtMs: number;
  expiresAtMs: number;
  nonce: string;
  status: ProposalStatus;
  action: GovernanceActionPayload;
  actionPayloadHash: string;
  resolutionReason?: string;
  executedAtMs?: number;
}

export interface VoteRecord {
  proposalId: string;
  voterDiscordUserId: string;
  castAtMs: number;
  value: VoteValue;
}

export type GovernanceEventType =
  | "proposal_created"
  | "vote_recorded"
  | "proposal_resolved"
  | "proposal_executed";

export interface GovernanceEventEnvelope {
  eventType: GovernanceEventType;
  eventVersion: number;
  issuedAtMs: number;
  nonce: string;
  guildId: string;
  proposalId?: string;
  actorDiscordUserId?: string;
  payload: Record<string, unknown>;
  payloadHash: string;
}

export interface SignedGovernanceEvent {
  eventId: string;
  eventType: GovernanceEventType;
  issuedAtMs: number;
  nonce: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  publicKey: string;
  signature: string;
}
