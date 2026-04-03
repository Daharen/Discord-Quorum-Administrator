import { describe, expect, it } from "vitest";
import { InMemoryKeyRepository } from "../src/repositories/in-memory/in-memory-key-repository.js";
import { InMemoryMembershipRepository } from "../src/repositories/in-memory/in-memory-membership-repository.js";
import { MembershipRegistry } from "../src/domain/membership-registry.js";
import { KeyRegistry } from "../src/domain/key-registry.js";

const clock = { nowMs: () => 1000 };

describe("KeyRegistry", () => {
  it("rejects non-active custodian registration", async () => {
    const membership = new MembershipRegistry(new InMemoryMembershipRepository(), { numerator: 2, denominator: 3 }, clock);
    const keys = new KeyRegistry(new InMemoryKeyRepository(), membership, clock);
    await expect(keys.registerKey("u1", "pub")).rejects.toThrow(/active custodians/);
  });
});
