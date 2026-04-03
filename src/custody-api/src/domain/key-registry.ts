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

  registerKey(discordUserId: string, publicKeyB64: string): string {
    if (!this.membershipRegistry.isActive(discordUserId)) {
      throw new Error("only active custodians can register keys");
    }

    const active = this.keys.getActiveByUser(discordUserId);
    if (active) {
      this.keys.revokeActiveByUser(discordUserId, this.clock.nowMs());
    }

    const keyId = newId("key");
    this.keys.create({
      keyId,
      discordUserId,
      publicKeyB64,
      registeredAtMs: this.clock.nowMs(),
      policyVersion: this.membershipRegistry.getPolicyVersion(),
    });
    return keyId;
  }

  revokeAllForRemovedCustodian(discordUserId: string): void {
    this.keys.revokeActiveByUser(discordUserId, this.clock.nowMs());
  }

  getActiveKeyForCustodian(discordUserId: string) {
    return this.keys.getActiveByUser(discordUserId);
  }
}
