import type { AuditRepository } from "../interfaces.js";
import type { AuditEntryRecord } from "../../types.js";

export class InMemoryAuditRepository implements AuditRepository {
  private readonly entries: AuditEntryRecord[] = [];

  append(entry: AuditEntryRecord): void {
    this.entries.push(entry);
  }

  list(): AuditEntryRecord[] {
    return [...this.entries];
  }
}
