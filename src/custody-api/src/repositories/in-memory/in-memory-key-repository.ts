import type { KeyRepository } from "../interfaces.js";
import type { CustodianPublicKeyRecord } from "../../types.js";

export class InMemoryKeyRepository implements KeyRepository {
  private readonly records: CustodianPublicKeyRecord[] = [];

  async create(record: CustodianPublicKeyRecord): Promise<void> {
    this.records.push(record);
  }

  async revokeActiveByUser(discordUserId: string, revokedAtMs: number): Promise<void> {
    for (const record of this.records) {
      if (record.discordUserId === discordUserId && !record.revokedAtMs) {
        record.revokedAtMs = revokedAtMs;
      }
    }
  }

  async getActiveByUser(discordUserId: string): Promise<CustodianPublicKeyRecord | undefined> {
    return [...this.records]
      .reverse()
      .find((record) => record.discordUserId === discordUserId && !record.revokedAtMs);
  }

  async listByUser(discordUserId: string): Promise<CustodianPublicKeyRecord[]> {
    return this.records.filter((record) => record.discordUserId === discordUserId);
  }
}
