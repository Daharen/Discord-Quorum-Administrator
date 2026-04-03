import type { MembershipRepository } from "../repositories/interfaces.js";
import type { Clock } from "../util/clock.js";
import type { SignedGuildBotEventEnvelope } from "../types.js";
import { computeRequiredThreshold, type ThresholdPolicy } from "./threshold-evaluator.js";

export class MembershipRegistry {
  private policyVersion = 1;

  constructor(
    private readonly memberships: MembershipRepository,
    private readonly policy: ThresholdPolicy,
    private readonly clock: Clock,
  ) {}

  async applyMembershipEvent(event: SignedGuildBotEventEnvelope): Promise<{ policyVersion: number; changed: boolean }> {
    if (!["administrator_promoted", "administrator_removed"].includes(event.eventType)) {
      return { policyVersion: this.policyVersion, changed: false };
    }
    const discordUserId = String(event.payload.discordUserId ?? "");
    if (!discordUserId) {
      throw new Error("membership event missing discordUserId");
    }

    const status = event.eventType === "administrator_promoted" ? "active" : "removed";
    this.policyVersion += 1;
    await this.memberships.upsert({
      discordUserId,
      status,
      policyVersion: this.policyVersion,
      changedAtMs: this.clock.nowMs(),
      sourceEventId: event.eventId,
    });
    return { policyVersion: this.policyVersion, changed: true };
  }

  async isActive(discordUserId: string): Promise<boolean> {
    return (await this.memberships.get(discordUserId))?.status === "active";
  }

  getPolicyVersion(): number {
    return this.policyVersion;
  }

  async getActiveCustodianIds(): Promise<string[]> {
    return (await this.memberships.listAll())
      .filter((record) => record.status === "active")
      .map((record) => record.discordUserId)
      .sort();
  }

  async getCurrentThreshold(): Promise<number> {
    return computeRequiredThreshold((await this.getActiveCustodianIds()).length, this.policy);
  }
}
