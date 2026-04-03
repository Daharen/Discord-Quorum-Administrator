import { describe, expect, it } from "vitest";
import { generateKeyPair, signPayload, canonicalizePayload, sha256 } from "../../crypto-core/src/index.js";
import { buildApp } from "../src/app.js";

describe("custody flow integration", () => {
  it("runs bot event -> membership -> key register -> session -> approvals -> authorization", async () => {
    const bot = generateKeyPair();
    const botPub = bot.publicKey.export({ format: "der", type: "spki" }).toString("base64");
    const app = buildApp({
      port: 0,
      bindHost: "127.0.0.1",
      botPublicKeyB64: botPub,
      guildIdAllowlist: new Set(["g1"]),
      defaultThresholdNumerator: 2,
      defaultThresholdDenominator: 3,
      sessionTtlSeconds: 60,
      encryptionMasterKeyB64: "master",
      auditDir: "runtime",
      eventMaxSkewMs: 99999999,
    });

    const c1 = generateKeyPair();
    const c2 = generateKeyPair();
    const custodianKeys = [c1, c2];

    for (const [idx, uid] of ["u1", "u2", "u3"].entries()) {
      const payload = { eventType: "administrator_promoted", issuedAtMs: Date.now(), nonce: `n${idx}`, guildId: "g1", payload: { discordUserId: uid } };
      const env = signPayload(payload, bot.privateKey, bot.publicKey);
      const event = { eventId: `evt${idx}`, eventType: "administrator_promoted", issuedAtMs: payload.issuedAtMs, nonce: payload.nonce, guildId: "g1", payload, payloadHash: sha256(canonicalizePayload(payload)), publicKey: env.publicKey, signature: env.signature };
      const res = await app.inject({ method: "POST", url: "/bot/events", payload: event });
      expect(res.statusCode).toBe(202);
    }

    for (const [idx, uid] of ["u1", "u2"].entries()) {
      const pub = custodianKeys[idx].publicKey.export({ format: "der", type: "spki" }).toString("base64");
      const res = await app.inject({ method: "POST", url: "/keys/register", payload: { discordUserId: uid, publicKeyB64: pub } });
      expect(res.statusCode).toBe(201);
    }

    const create = await app.inject({ method: "POST", url: "/sessions/create", payload: { scope: "rekey", actionType: "recovery_session_initiated", payload: { ticket: "1" } } });
    expect(create.statusCode).toBe(201);
    const session = create.json();

    for (const [idx, uid] of ["u1", "u2"].entries()) {
      const signature = signPayload(session.canonicalPayload, custodianKeys[idx].privateKey, custodianKeys[idx].publicKey).signature;
      const approve = await app.inject({ method: "POST", url: `/sessions/${session.sessionId}/approve`, payload: { signerDiscordUserId: uid, signatureB64: signature } });
      expect(approve.statusCode).toBe(200);
    }

    const fetch = await app.inject({ method: "GET", url: `/sessions/${session.sessionId}` });
    expect(fetch.json().status).toBe("authorized");

    const removePayload = { eventType: "administrator_removed", issuedAtMs: Date.now(), nonce: "nremove", guildId: "g1", payload: { discordUserId: "u2" } };
    const removeEnv = signPayload(removePayload, bot.privateKey, bot.publicKey);
    const removeEvent = { eventId: "evtr", eventType: "administrator_removed", issuedAtMs: removePayload.issuedAtMs, nonce: removePayload.nonce, guildId: "g1", payload: removePayload, payloadHash: sha256(canonicalizePayload(removePayload)), publicKey: removeEnv.publicKey, signature: removeEnv.signature };
    expect((await app.inject({ method: "POST", url: "/bot/events", payload: removeEvent })).statusCode).toBe(202);

    const create2 = await app.inject({ method: "POST", url: "/sessions/create", payload: { scope: "rekey", actionType: "recovery_session_initiated", payload: { ticket: "2" } } });
    const s2 = create2.json();
    const badSig = signPayload(s2.canonicalPayload, c2.privateKey, c2.publicKey).signature;
    const badApprove = await app.inject({ method: "POST", url: `/sessions/${s2.sessionId}/approve`, payload: { signerDiscordUserId: "u2", signatureB64: badSig } });
    expect(badApprove.statusCode).toBe(500);
  });
});
