import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { generateKeyPair, sha256, canonicalizePayload, signPayload } from "crypto-core";

describe("POST /bot/events", () => {
  it("accepts valid signed event", async () => {
    const keys = generateKeyPair();
    const pub = keys.publicKey.export({ format: "der", type: "spki" }).toString("base64");
    const app = await buildApp({
      port: 0,
      bindHost: "127.0.0.1",
      botPublicKeyB64: pub,
      guildIdAllowlist: new Set(["g1"]),
      defaultThresholdNumerator: 2,
      defaultThresholdDenominator: 3,
      sessionTtlSeconds: 60,
      encryptionMasterKeyB64: "x",
      auditDir: "runtime",
      eventMaxSkewMs: 99999999,
      repositoryMode: "memory",
    });

    const payload = { eventType: "administrator_promoted", issuedAtMs: Date.now(), nonce: "n1", guildId: "g1", payload: { discordUserId: "u1" } };
    const env = signPayload(payload, keys.privateKey, keys.publicKey);
    const event = {
      eventId: "evt1",
      eventType: "administrator_promoted",
      issuedAtMs: payload.issuedAtMs,
      nonce: "n1",
      guildId: "g1",
      payload,
      payloadHash: sha256(canonicalizePayload(payload)),
      publicKey: env.publicKey,
      signature: env.signature,
    };

    const res = await app.inject({ method: "POST", url: "/bot/events", payload: event });
    expect(res.statusCode).toBe(202);
  });
});
