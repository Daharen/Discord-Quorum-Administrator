import { describe, expect, it } from "vitest";
import { generateKeyPair, signPayload } from "../../crypto-core/src/index.js";
import { SessionEngine } from "../src/domain/session-engine.js";
import { MembershipRegistry } from "../src/domain/membership-registry.js";
import { KeyRegistry } from "../src/domain/key-registry.js";
import { InMemoryMembershipRepository } from "../src/repositories/in-memory/in-memory-membership-repository.js";
import { InMemoryKeyRepository } from "../src/repositories/in-memory/in-memory-key-repository.js";
import { InMemorySessionRepository } from "../src/repositories/in-memory/in-memory-session-repository.js";

const clock = { now: 1_000, nowMs() { return this.now; } };

describe("SessionEngine", () => {
  it("authorizes session when threshold met and rejects duplicate approvals", () => {
    const membership = new MembershipRegistry(new InMemoryMembershipRepository(), { numerator: 2, denominator: 3 }, clock);
    const keyRegistry = new KeyRegistry(new InMemoryKeyRepository(), membership, clock);

    const promoted = (userId: string, id: string) => ({
      eventId: id,
      eventType: "administrator_promoted" as const,
      issuedAtMs: 1,
      nonce: "n",
      guildId: "g1",
      payload: { discordUserId: userId },
      payloadHash: "h",
      publicKey: "k",
      signature: "s",
    });

    membership.applyMembershipEvent(promoted("u1", "e1"));
    membership.applyMembershipEvent(promoted("u2", "e2"));
    membership.applyMembershipEvent(promoted("u3", "e3"));

    const k1 = generateKeyPair();
    const k2 = generateKeyPair();
    keyRegistry.registerKey("u1", k1.publicKey.export({ format: "der", type: "spki" }).toString("base64"));
    keyRegistry.registerKey("u2", k2.publicKey.export({ format: "der", type: "spki" }).toString("base64"));

    const engine = new SessionEngine(new InMemorySessionRepository(), membership, keyRegistry, clock, 10);
    const session = engine.createSession("rekey", "recovery_session_initiated", { plan: "x" });

    const sig1 = signPayload(session.canonicalPayload, k1.privateKey, k1.publicKey).signature;
    const sig2 = signPayload(session.canonicalPayload, k2.privateKey, k2.publicKey).signature;

    const afterOne = engine.submitApproval(session.sessionId, "u1", sig1);
    expect(afterOne.status).toBe("pending");

    const afterTwo = engine.submitApproval(session.sessionId, "u2", sig2);
    expect(afterTwo.status).toBe("authorized");

    expect(() => engine.submitApproval(session.sessionId, "u2", sig2)).toThrow(/duplicate/);
  });

  it("rejects approvals after expiration", () => {
    const membership = new MembershipRegistry(new InMemoryMembershipRepository(), { numerator: 2, denominator: 3 }, clock);
    const keyRegistry = new KeyRegistry(new InMemoryKeyRepository(), membership, clock);
    membership.applyMembershipEvent({ eventId: "e1", eventType: "administrator_promoted", issuedAtMs: 1, nonce: "n", guildId: "g", payload: { discordUserId: "u1" }, payloadHash: "h", publicKey: "k", signature: "s" });
    const k1 = generateKeyPair();
    keyRegistry.registerKey("u1", k1.publicKey.export({ format: "der", type: "spki" }).toString("base64"));

    const engine = new SessionEngine(new InMemorySessionRepository(), membership, keyRegistry, clock, 1);
    const session = engine.createSession("rekey", "recovery_session_initiated", { plan: "x" });
    clock.now = session.expiresAtMs + 1;
    const sig = signPayload(session.canonicalPayload, k1.privateKey, k1.publicKey).signature;
    expect(() => engine.submitApproval(session.sessionId, "u1", sig)).toThrow(/expired/);
  });
});
