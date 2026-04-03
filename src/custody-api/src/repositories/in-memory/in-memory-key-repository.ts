import type { KeyRepository } from "../interfaces.js";
import type { CustodianPublicKeyRecord } from "../../types.js";

export class InMemoryKeyRepository implements KeyRepository {
  private readonly records: CustodianPublicKeyRecord[] = [];

  create(record: CustodianPublicKeyRecord): void {
    this.records.push(record);
  }

  revokeActiveByUser(discordUserId: string, revokedAtMs: number): void {
    for (const record of this.records) {
      if (record.discordUserId === discordUserId && !record.revokedAtMs) {
        record.revokedAtMs = revokedAtMs;
      }
    }
  }

  getActiveByUser(discordUserId: string): CustodianPublicKeyRecord | undefined {
    return [...this.records]
      .reverse()
      .find((record) => record.discordUserId === discordUserId && !record.revokedAtMs);
  }

  listByUser(discordUserId: string): CustodianPublicKeyRecord[] {
    return this.records.filter((record) => record.discordUserId === discordUserId);
  }
}
