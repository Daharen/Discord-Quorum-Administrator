import { canonicalizePayload, sha256 } from "crypto-core";
import type { AuditRepository } from "../repositories/interfaces.js";
import type { AuditEntryRecord } from "../types.js";
import type { Clock } from "../util/clock.js";
import { newId } from "../util/ids.js";

export class AuditLog {
  private previousHash = "GENESIS";

  constructor(
    private readonly repository: AuditRepository,
    private readonly clock: Clock,
  ) {}

  async append(eventType: string, entityId: string, data: Record<string, unknown>, actor?: string): Promise<AuditEntryRecord> {
    const occurredAtMs = this.clock.nowMs();
    const payload = canonicalizePayload({ eventType, entityId, occurredAtMs, data, actor, previousHash: this.previousHash });
    const entryHash = sha256(payload);
    const entry: AuditEntryRecord = {
      entryId: newId("audit"),
      occurredAtMs,
      eventType,
      entityId,
      actor,
      data,
      previousHash: this.previousHash,
      entryHash,
    };
    await this.repository.append(entry);
    this.previousHash = entryHash;
    return entry;
  }

  list(): Promise<AuditEntryRecord[]> {
    return this.repository.list();
  }
}
