import type { AuditEntryRecord, CustodianMembershipRecord, CustodianPublicKeyRecord, CustodySessionRecord } from "../../types.js";
import type { AuditRepository, KeyRepository, MembershipRepository, SealedKitRecord, SealedKitRepository, SessionRepository } from "../interfaces.js";
import { PostgresClient } from "./client.js";

function json(value: unknown): string {
  return JSON.stringify(value);
}

export class PostgresMembershipRepository implements MembershipRepository {
  constructor(private readonly db: PostgresClient) {}

  async upsert(record: CustodianMembershipRecord): Promise<void> {
    await this.db.query(
      `insert into custody_membership (discord_user_id, status, policy_version, changed_at_ms, source_event_id)
       values ($1,$2,$3,$4,$5)
       on conflict (discord_user_id)
       do update set status=excluded.status, policy_version=excluded.policy_version, changed_at_ms=excluded.changed_at_ms, source_event_id=excluded.source_event_id`,
      [record.discordUserId, record.status, record.policyVersion, record.changedAtMs, record.sourceEventId],
    );
  }

  async get(discordUserId: string): Promise<CustodianMembershipRecord | undefined> {
    const rows = await this.db.query<CustodianMembershipRecord>(`select discord_user_id as "discordUserId", status, policy_version as "policyVersion", changed_at_ms as "changedAtMs", source_event_id as "sourceEventId" from custody_membership where discord_user_id = $1`, [discordUserId]);
    return rows[0];
  }

  listAll(): Promise<CustodianMembershipRecord[]> {
    return this.db.query<CustodianMembershipRecord>(`select discord_user_id as "discordUserId", status, policy_version as "policyVersion", changed_at_ms as "changedAtMs", source_event_id as "sourceEventId" from custody_membership order by discord_user_id`);
  }
}

export class PostgresKeyRepository implements KeyRepository {
  constructor(private readonly db: PostgresClient) {}

  async create(record: CustodianPublicKeyRecord): Promise<void> {
    await this.db.query(`insert into custody_keys (key_id, discord_user_id, public_key_b64, registered_at_ms, revoked_at_ms, policy_version) values ($1,$2,$3,$4,$5,$6)`, [record.keyId, record.discordUserId, record.publicKeyB64, record.registeredAtMs, record.revokedAtMs ?? null, record.policyVersion]);
  }

  async revokeActiveByUser(discordUserId: string, revokedAtMs: number): Promise<void> {
    await this.db.query(`update custody_keys set revoked_at_ms = $2 where discord_user_id = $1 and revoked_at_ms is null`, [discordUserId, revokedAtMs]);
  }

  async getActiveByUser(discordUserId: string): Promise<CustodianPublicKeyRecord | undefined> {
    const rows = await this.db.query<CustodianPublicKeyRecord>(`select key_id as "keyId", discord_user_id as "discordUserId", public_key_b64 as "publicKeyB64", registered_at_ms as "registeredAtMs", revoked_at_ms as "revokedAtMs", policy_version as "policyVersion" from custody_keys where discord_user_id = $1 and revoked_at_ms is null order by registered_at_ms desc limit 1`, [discordUserId]);
    return rows[0];
  }

  listByUser(discordUserId: string): Promise<CustodianPublicKeyRecord[]> {
    return this.db.query<CustodianPublicKeyRecord>(`select key_id as "keyId", discord_user_id as "discordUserId", public_key_b64 as "publicKeyB64", registered_at_ms as "registeredAtMs", revoked_at_ms as "revokedAtMs", policy_version as "policyVersion" from custody_keys where discord_user_id = $1 order by registered_at_ms`, [discordUserId]);
  }
}

export class PostgresSessionRepository implements SessionRepository {
  constructor(private readonly db: PostgresClient) {}

  async create(session: CustodySessionRecord): Promise<void> {
    await this.save(session);
  }

  async save(session: CustodySessionRecord): Promise<void> {
    await this.db.withClient(async (client) => {
      await client.query("begin");
      await client.query(`insert into custody_sessions (session_id, scope, created_at_ms, expires_at_ms, required_threshold, policy_version, canonical_payload_hash, canonical_payload, status)
        values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)
        on conflict (session_id)
        do update set scope=excluded.scope, expires_at_ms=excluded.expires_at_ms, required_threshold=excluded.required_threshold, policy_version=excluded.policy_version, canonical_payload_hash=excluded.canonical_payload_hash, canonical_payload=excluded.canonical_payload, status=excluded.status`,
        [session.sessionId, session.scope, session.createdAtMs, session.expiresAtMs, session.requiredThreshold, session.policyVersion, session.canonicalPayloadHash, json(session.canonicalPayload), session.status],
      );
      await client.query(`delete from custody_session_approvals where session_id = $1`, [session.sessionId]);
      for (const approval of session.approvals) {
        await client.query(`insert into custody_session_approvals (approval_id, session_id, signer_discord_user_id, signer_key_id, signature_b64, approved_at_ms, policy_version)
          values ($1,$2,$3,$4,$5,$6,$7)`,
          [approval.approvalId, approval.sessionId, approval.signerDiscordUserId, approval.signerKeyId, approval.signatureB64, approval.approvedAtMs, approval.policyVersion],
        );
      }
      await client.query("commit");
    });
  }

  async get(sessionId: string): Promise<CustodySessionRecord | undefined> {
    const rows = await this.db.query<any>(`select session_id, scope, created_at_ms, expires_at_ms, required_threshold, policy_version, canonical_payload_hash, canonical_payload, status from custody_sessions where session_id = $1`, [sessionId]);
    if (!rows[0]) return undefined;
    const approvals = await this.db.query<any>(`select approval_id, session_id, signer_discord_user_id, signer_key_id, signature_b64, approved_at_ms, policy_version from custody_session_approvals where session_id = $1 order by approved_at_ms`, [sessionId]);
    return {
      sessionId: rows[0].session_id,
      scope: rows[0].scope,
      createdAtMs: rows[0].created_at_ms,
      expiresAtMs: rows[0].expires_at_ms,
      requiredThreshold: rows[0].required_threshold,
      policyVersion: rows[0].policy_version,
      canonicalPayloadHash: rows[0].canonical_payload_hash,
      canonicalPayload: rows[0].canonical_payload,
      status: rows[0].status,
      approvals: approvals.map((a) => ({ approvalId: a.approval_id, sessionId: a.session_id, signerDiscordUserId: a.signer_discord_user_id, signerKeyId: a.signer_key_id, signatureB64: a.signature_b64, approvedAtMs: a.approved_at_ms, policyVersion: a.policy_version })),
    };
  }

  async listAll(): Promise<CustodySessionRecord[]> {
    const sessions = await this.db.query<any>(`select session_id from custody_sessions order by created_at_ms`);
    const loaded = await Promise.all(sessions.map((session) => this.get(session.session_id)));
    return loaded.filter((session): session is CustodySessionRecord => Boolean(session));
  }
}

export class PostgresAuditRepository implements AuditRepository {
  constructor(private readonly db: PostgresClient) {}

  async append(entry: AuditEntryRecord): Promise<void> {
    await this.db.query(`insert into custody_audit_log (entry_id, occurred_at_ms, event_type, entity_id, actor, data, previous_hash, entry_hash)
      values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`, [entry.entryId, entry.occurredAtMs, entry.eventType, entry.entityId, entry.actor ?? null, json(entry.data), entry.previousHash, entry.entryHash]);
  }

  async list(): Promise<AuditEntryRecord[]> {
    const rows = await this.db.query<any>(`select entry_id, occurred_at_ms, event_type, entity_id, actor, data, previous_hash, entry_hash from custody_audit_log order by occurred_at_ms`);
    return rows.map((row) => ({ entryId: row.entry_id, occurredAtMs: row.occurred_at_ms, eventType: row.event_type, entityId: row.entity_id, actor: row.actor ?? undefined, data: row.data, previousHash: row.previous_hash, entryHash: row.entry_hash }));
  }
}

export class PostgresSealedKitRepository implements SealedKitRepository {
  constructor(private readonly db: PostgresClient) {}

  async upsert(record: SealedKitRecord): Promise<void> {
    await this.db.query(`insert into sealed_kits (version, ciphertext_b64, metadata, updated_at_ms)
      values ($1,$2,$3::jsonb,$4)
      on conflict (version) do update set ciphertext_b64=excluded.ciphertext_b64, metadata=excluded.metadata, updated_at_ms=excluded.updated_at_ms`, [record.version, record.ciphertextB64, json(record.metadata), record.updatedAtMs]);
  }

  async getCurrent(): Promise<SealedKitRecord | undefined> {
    const rows = await this.db.query<any>(`select version, ciphertext_b64, metadata, updated_at_ms from sealed_kits order by version desc limit 1`);
    if (!rows[0]) return undefined;
    return { version: rows[0].version, ciphertextB64: rows[0].ciphertext_b64, metadata: rows[0].metadata, updatedAtMs: rows[0].updated_at_ms };
  }
}
