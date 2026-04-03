import type {
  AuditEntryRecord,
  CustodianMembershipRecord,
  CustodianPublicKeyRecord,
  CustodySessionRecord,
} from "../types.js";

export interface MembershipRepository {
  upsert(record: CustodianMembershipRecord): Promise<void>;
  get(discordUserId: string): Promise<CustodianMembershipRecord | undefined>;
  listAll(): Promise<CustodianMembershipRecord[]>;
}

export interface KeyRepository {
  create(record: CustodianPublicKeyRecord): Promise<void>;
  revokeActiveByUser(discordUserId: string, revokedAtMs: number): Promise<void>;
  getActiveByUser(discordUserId: string): Promise<CustodianPublicKeyRecord | undefined>;
  listByUser(discordUserId: string): Promise<CustodianPublicKeyRecord[]>;
}

export interface SessionRepository {
  create(session: CustodySessionRecord): Promise<void>;
  save(session: CustodySessionRecord): Promise<void>;
  get(sessionId: string): Promise<CustodySessionRecord | undefined>;
  listAll(): Promise<CustodySessionRecord[]>;
}

export interface AuditRepository {
  append(entry: AuditEntryRecord): Promise<void>;
  list(): Promise<AuditEntryRecord[]>;
}

export interface SealedKitRecord {
  version: number;
  ciphertextB64: string;
  metadata: Record<string, unknown>;
  updatedAtMs: number;
}

export interface SealedKitRepository {
  upsert(record: SealedKitRecord): Promise<void>;
  getCurrent(): Promise<SealedKitRecord | undefined>;
}
