import type { SessionRepository } from "../interfaces.js";
import type { CustodySessionRecord } from "../../types.js";

export class InMemorySessionRepository implements SessionRepository {
  private readonly records = new Map<string, CustodySessionRecord>();

  async create(session: CustodySessionRecord): Promise<void> {
    this.records.set(session.sessionId, session);
  }

  async save(session: CustodySessionRecord): Promise<void> {
    this.records.set(session.sessionId, session);
  }

  async get(sessionId: string): Promise<CustodySessionRecord | undefined> {
    return this.records.get(sessionId);
  }

  async listAll(): Promise<CustodySessionRecord[]> {
    return [...this.records.values()];
  }
}
