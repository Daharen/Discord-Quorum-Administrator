import type { SessionRepository } from "../interfaces.js";
import type { CustodySessionRecord } from "../../types.js";

export class InMemorySessionRepository implements SessionRepository {
  private readonly records = new Map<string, CustodySessionRecord>();

  create(session: CustodySessionRecord): void {
    this.records.set(session.sessionId, session);
  }

  save(session: CustodySessionRecord): void {
    this.records.set(session.sessionId, session);
  }

  get(sessionId: string): CustodySessionRecord | undefined {
    return this.records.get(sessionId);
  }

  listAll(): CustodySessionRecord[] {
    return [...this.records.values()];
  }
}
