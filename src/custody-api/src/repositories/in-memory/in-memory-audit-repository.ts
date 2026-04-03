import type { AuditRepository } from "../interfaces.js";
import type { AuditEntryRecord } from "../../types.js";

export class InMemoryAuditRepository implements AuditRepository {
  private readonly entries: AuditEntryRecord[] = [];

  async append(entry: AuditEntryRecord): Promise<void> {
    this.entries.push(entry);
  }

  async list(): Promise<AuditEntryRecord[]> {
    return [...this.entries];
  }
}
