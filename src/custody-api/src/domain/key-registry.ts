import type { KeyRepository } from "../repositories/interfaces.js";
import type { Clock } from "../util/clock.js";
import { newId } from "../util/ids.js";
import type { MembershipRegistry } from "./membership-registry.js";

export class KeyRegistry {
  constructor(
    private readonly keys: KeyRepository,
    private readonly membershipRegistry: MembershipRegistry,
    private readonly clock: Clock,
  ) {}

  async registerKey(discordUserId: string, publicKeyB64: string): Promise<string> {
    if (!(await this.membershipRegistry.isActive(discordUserId))) {
      throw new Error("only active custodians can register keys");
    }

    const active = await this.keys.getActiveByUser(discordUserId);
    if (active) {
      await this.keys.revokeActiveByUser(discordUserId, this.clock.nowMs());
    }

    const keyId = newId("key");
    await this.keys.create({
      keyId,
      discordUserId,
      publicKeyB64,
      registeredAtMs: this.clock.nowMs(),
      policyVersion: this.membershipRegistry.getPolicyVersion(),
    });
    return keyId;
  }

  async revokeAllForRemovedCustodian(discordUserId: string): Promise<void> {
    await this.keys.revokeActiveByUser(discordUserId, this.clock.nowMs());
  }

  async getActiveKeyForCustodian(discordUserId: string) {
    return this.keys.getActiveByUser(discordUserId);
  }
}
