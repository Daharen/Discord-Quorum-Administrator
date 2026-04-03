import { describe, expect, it } from "vitest";
import { canonicalizePayload, generateKeyPair } from "crypto-core";
import { GovernanceEventEmitter } from "../src/governance/event-emitter.js";

describe("GovernanceEventEmitter", () => {
  it("canonicalizes identical payloads identically", () => {
    const a = canonicalizePayload({ z: 1, a: { y: 2, x: 1 } });
    const b = canonicalizePayload({ a: { x: 1, y: 2 }, z: 1 });
    expect(a).toBe(b);
  });

  it("includes nonce, timestamp, and payload hash", () => {
    const keys = generateKeyPair();
    const emitter = new GovernanceEventEmitter(keys.privateKey, keys.publicKey);
    const event = emitter.emit({
      eventType: "proposal_created",
      issuedAtMs: 42,
      guildId: "g1",
      payload: { hello: "world" },
      proposalId: "p1",
      actorDiscordUserId: "u1",
      nonce: "n1",
    });

    expect(event.nonce).toBe("n1");
    expect(event.issuedAtMs).toBe(42);
    expect(event.payloadHash).toHaveLength(64);
  });

  it("verifies signature", () => {
    const keys = generateKeyPair();
    const emitter = new GovernanceEventEmitter(keys.privateKey, keys.publicKey);
    const event = emitter.emit({
      eventType: "proposal_created",
      issuedAtMs: 42,
      guildId: "g1",
      payload: { hello: "world" },
    });

    expect(emitter.verify(event)).toBe(true);
  });

  it("fails verification when tampered", () => {
    const keys = generateKeyPair();
    const emitter = new GovernanceEventEmitter(keys.privateKey, keys.publicKey);
    const event = emitter.emit({
      eventType: "proposal_created",
      issuedAtMs: 42,
      guildId: "g1",
      payload: { hello: "world" },
    });

    const tampered = { ...event, payload: { ...event.payload, guildId: "g2" } };
    expect(emitter.verify(tampered)).toBe(false);
  });
});
