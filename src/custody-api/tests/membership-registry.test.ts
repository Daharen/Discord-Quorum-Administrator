import { describe, expect, it } from "vitest";
import { InMemoryMembershipRepository } from "../src/repositories/in-memory/in-memory-membership-repository.js";
import { MembershipRegistry } from "../src/domain/membership-registry.js";

const clock = { nowMs: () => 1000 };

describe("MembershipRegistry", () => {
  it("promotes and removes custodians, increments policy", () => {
    const registry = new MembershipRegistry(new InMemoryMembershipRepository(), { numerator: 2, denominator: 3 }, clock);
    const promote = {
      eventId: "e1",
      eventType: "administrator_promoted",
      issuedAtMs: 1,
      nonce: "n",
      guildId: "g1",
      payload: { discordUserId: "u1" },
      payloadHash: "h",
      publicKey: "k",
      signature: "s",
    } as const;

    registry.applyMembershipEvent(promote);
    expect(registry.isActive("u1")).toBe(true);

    registry.applyMembershipEvent({ ...promote, eventId: "e2", eventType: "administrator_removed" });
    expect(registry.isActive("u1")).toBe(false);
    expect(registry.getPolicyVersion()).toBe(3);
  });
});
