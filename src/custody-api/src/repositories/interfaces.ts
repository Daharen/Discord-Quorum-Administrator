import type {
  AuditEntryRecord,
  CustodianMembershipRecord,
  CustodianPublicKeyRecord,
  CustodySessionRecord,
} from "../types.js";

export interface MembershipRepository {
  upsert(record: CustodianMembershipRecord): void;
  get(discordUserId: string): CustodianMembershipRecord | undefined;
  listAll(): CustodianMembershipRecord[];
}

export interface KeyRepository {
  create(record: CustodianPublicKeyRecord): void;
  revokeActiveByUser(discordUserId: string, revokedAtMs: number): void;
  getActiveByUser(discordUserId: string): CustodianPublicKeyRecord | undefined;
  listByUser(discordUserId: string): CustodianPublicKeyRecord[];
}

export interface SessionRepository {
  create(session: CustodySessionRecord): void;
  save(session: CustodySessionRecord): void;
  get(sessionId: string): CustodySessionRecord | undefined;
  listAll(): CustodySessionRecord[];
}

export interface AuditRepository {
  append(entry: AuditEntryRecord): void;
  list(): AuditEntryRecord[];
}

export interface SealedKitRecord {
  version: number;
  ciphertextB64: string;
  metadata: Record<string, unknown>;
  updatedAtMs: number;
}

export interface SealedKitRepository {
  upsert(record: SealedKitRecord): void;
  getCurrent(): SealedKitRecord | undefined;
}
