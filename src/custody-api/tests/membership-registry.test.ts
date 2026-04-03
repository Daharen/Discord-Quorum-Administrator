import { describe, expect, it } from "vitest";
import { InMemoryMembershipRepository } from "../src/repositories/in-memory/in-memory-membership-repository.js";
import { MembershipRegistry } from "../src/domain/membership-registry.js";

const clock = { nowMs: () => 1000 };

describe("MembershipRegistry", () => {
  it("promotes and removes custodians, increments policy", async () => {
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

    await registry.applyMembershipEvent(promote);
    expect(await registry.isActive("u1")).toBe(true);

    await registry.applyMembershipEvent({ ...promote, eventId: "e2", eventType: "administrator_removed" });
    expect(await registry.isActive("u1")).toBe(false);
    expect(registry.getPolicyVersion()).toBe(3);
  });
});
