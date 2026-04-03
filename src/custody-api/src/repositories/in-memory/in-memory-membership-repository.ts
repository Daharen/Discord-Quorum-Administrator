import type { MembershipRepository } from "../interfaces.js";
import type { CustodianMembershipRecord } from "../../types.js";

export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly records = new Map<string, CustodianMembershipRecord>();

  upsert(record: CustodianMembershipRecord): void {
    this.records.set(record.discordUserId, record);
  }

  get(discordUserId: string): CustodianMembershipRecord | undefined {
    return this.records.get(discordUserId);
  }

  listAll(): CustodianMembershipRecord[] {
    return [...this.records.values()];
  }
}
