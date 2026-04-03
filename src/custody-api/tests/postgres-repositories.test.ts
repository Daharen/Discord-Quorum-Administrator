import { describe, expect, it } from "vitest";
import { PostgresClient } from "../src/repositories/postgres/client.js";
import { migrate } from "../src/repositories/postgres/migrate.js";
import {
  PostgresAuditRepository,
  PostgresKeyRepository,
  PostgresMembershipRepository,
  PostgresSessionRepository,
} from "../src/repositories/postgres/postgres-repositories.js";

const url = process.env.CUSTODY_API_DATABASE_URL;
const maybeDescribe = url ? describe : describe.skip;

maybeDescribe("postgres repository roundtrips", () => {
  it("persists membership, keys, sessions, approvals, and audit", async () => {
    const db = new PostgresClient(url as string);
    await migrate(db);

    const memberships = new PostgresMembershipRepository(db);
    const keys = new PostgresKeyRepository(db);
    const sessions = new PostgresSessionRepository(db);
    const audit = new PostgresAuditRepository(db);

    await memberships.upsert({ discordUserId: "u1", status: "active", policyVersion: 2, changedAtMs: 1, sourceEventId: "e1" });
    expect((await memberships.get("u1"))?.status).toBe("active");

    await keys.create({ keyId: "k1", discordUserId: "u1", publicKeyB64: "pk", registeredAtMs: 1, policyVersion: 2 });
    expect((await keys.getActiveByUser("u1"))?.keyId).toBe("k1");

    await sessions.create({
      sessionId: "s1",
      scope: "rekey",
      createdAtMs: 1,
      expiresAtMs: 2,
      requiredThreshold: 1,
      policyVersion: 2,
      canonicalPayloadHash: "h1",
      canonicalPayload: { actionType: "a", sessionId: "s1", timestamp: 1, nonce: "n", payload: {}, policyVersion: 2 },
      status: "authorized",
      approvals: [{ approvalId: "a1", sessionId: "s1", signerDiscordUserId: "u1", signerKeyId: "k1", signatureB64: "sig", approvedAtMs: 1, policyVersion: 2 }],
    });

    const session = await sessions.get("s1");
    expect(session?.approvals.length).toBe(1);

    await audit.append({ entryId: "x1", occurredAtMs: 1, eventType: "t", entityId: "e", data: {}, previousHash: "g", entryHash: "h" });
    expect((await audit.list()).length).toBeGreaterThan(0);

    await db.close();
  });
});
