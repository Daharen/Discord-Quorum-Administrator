import { describe, expect, it } from "vitest";
import { canonicalizePayload, generateKeyPair, sha256, signPayload } from "../../crypto-core/src/index.js";
import { GuildBotEventVerifier } from "../src/crypto/guildbot-event-verifier.js";

const clock = { nowMs: () => 1_000_000 };

function makeEvent(overrides: Record<string, unknown> = {}) {
  const keys = generateKeyPair();
  const payload = {
    eventType: "administrator_promoted",
    issuedAtMs: 1_000_000,
    nonce: "n1",
    guildId: "g1",
    payload: { discordUserId: "u1" },
  };
  const envelope = signPayload(payload, keys.privateKey, keys.publicKey);
  return {
    keys,
    event: {
      eventId: "evt1",
      eventType: "administrator_promoted",
      issuedAtMs: 1_000_000,
      nonce: "n1",
      guildId: "g1",
      payload,
      payloadHash: sha256(canonicalizePayload(payload)),
      publicKey: envelope.publicKey,
      signature: envelope.signature,
      ...overrides,
    },
  };
}

describe("GuildBotEventVerifier", () => {
  it("accepts valid signed event", () => {
    const { event } = makeEvent();
    const verifier = new GuildBotEventVerifier(new Set(["g1"]), event.publicKey, 60_000, clock);
    expect(() => verifier.verify(event)).not.toThrow();
  });

  it("rejects tampered event", () => {
    const { event } = makeEvent({ payloadHash: "abc" });
    const verifier = new GuildBotEventVerifier(new Set(["g1"]), event.publicKey, 60_000, clock);
    expect(() => verifier.verify(event)).toThrow(/payload hash mismatch/);
  });

  it("rejects replay", () => {
    const { event } = makeEvent();
    const verifier = new GuildBotEventVerifier(new Set(["g1"]), event.publicKey, 60_000, clock);
    verifier.verify(event);
    expect(() => verifier.verify(event)).toThrow(/replay/);
  });
});
