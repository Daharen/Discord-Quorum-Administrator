import type { MembershipRepository } from "../interfaces.js";
import type { CustodianMembershipRecord } from "../../types.js";

export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly records = new Map<string, CustodianMembershipRecord>();

  async upsert(record: CustodianMembershipRecord): Promise<void> {
    this.records.set(record.discordUserId, record);
  }

  async get(discordUserId: string): Promise<CustodianMembershipRecord | undefined> {
    return this.records.get(discordUserId);
  }

  async listAll(): Promise<CustodianMembershipRecord[]> {
    return [...this.records.values()];
  }
}
