import { canonicalizePayload, sha256, verifySignature } from "crypto-core";
import type { SessionRepository } from "../repositories/interfaces.js";
import type { Clock } from "../util/clock.js";
import { newId } from "../util/ids.js";
import type { KeyRegistry } from "./key-registry.js";
import type { MembershipRegistry } from "./membership-registry.js";
import { thresholdReached } from "./threshold-evaluator.js";
import type { CanonicalSessionPayload, CustodySessionApprovalRecord, CustodySessionRecord } from "../types.js";

export class SessionEngine {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly membershipRegistry: MembershipRegistry,
    private readonly keyRegistry: KeyRegistry,
    private readonly clock: Clock,
    private readonly sessionTtlSeconds: number,
  ) {}

  async createSession(scope: string, actionType: string, payloadData: Record<string, unknown>): Promise<CustodySessionRecord> {
    const sessionId = newId("session");
    const createdAtMs = this.clock.nowMs();
    const canonicalPayload: CanonicalSessionPayload = {
      actionType,
      sessionId,
      timestamp: createdAtMs,
      nonce: newId("nonce"),
      payload: payloadData,
      policyVersion: this.membershipRegistry.getPolicyVersion(),
    };

    const session: CustodySessionRecord = {
      sessionId,
      scope,
      createdAtMs,
      expiresAtMs: createdAtMs + this.sessionTtlSeconds * 1000,
      requiredThreshold: await this.membershipRegistry.getCurrentThreshold(),
      policyVersion: this.membershipRegistry.getPolicyVersion(),
      canonicalPayloadHash: sha256(canonicalizePayload(canonicalPayload)),
      canonicalPayload,
      status: "pending",
      approvals: [],
    };
    await this.sessions.create(session);
    return session;
  }

  async submitApproval(sessionId: string, signerDiscordUserId: string, signatureB64: string): Promise<CustodySessionRecord> {
    const session = await this.requireSession(sessionId);
    if (session.status === "closed" || session.status === "expired") throw new Error("session not active");
    if (this.clock.nowMs() > session.expiresAtMs) {
      session.status = "expired";
      await this.sessions.save(session);
      throw new Error("session expired");
    }

    if (!(await this.membershipRegistry.isActive(signerDiscordUserId))) {
      throw new Error("signer is not active custodian");
    }

    if (session.approvals.some((approval) => approval.signerDiscordUserId === signerDiscordUserId)) {
      throw new Error("duplicate approval");
    }

    const key = await this.keyRegistry.getActiveKeyForCustodian(signerDiscordUserId);
    if (!key) throw new Error("missing active key");

    const isValid = verifySignature(session.canonicalPayload, {
      payloadHash: session.canonicalPayloadHash,
      publicKey: key.publicKeyB64,
      signature: signatureB64,
    });
    if (!isValid) throw new Error("invalid signature");

    const approval: CustodySessionApprovalRecord = {
      approvalId: newId("approval"),
      sessionId,
      signerDiscordUserId,
      signerKeyId: key.keyId,
      signatureB64,
      approvedAtMs: this.clock.nowMs(),
      policyVersion: session.policyVersion,
    };

    session.approvals.push(approval);
    if (thresholdReached(session.requiredThreshold, new Set(session.approvals.map((a) => a.signerDiscordUserId)).size)) {
      session.status = "authorized";
    }

    await this.sessions.save(session);
    return session;
  }

  async expireSession(sessionId: string): Promise<CustodySessionRecord> {
    const session = await this.requireSession(sessionId);
    session.status = "expired";
    await this.sessions.save(session);
    return session;
  }

  async closeSession(sessionId: string): Promise<CustodySessionRecord> {
    const session = await this.requireSession(sessionId);
    session.status = "closed";
    await this.sessions.save(session);
    return session;
  }

  async invalidateSupersededApprovals(newPolicyVersion: number): Promise<number> {
    let invalidated = 0;
    for (const session of await this.sessions.listAll()) {
      if (session.status !== "pending") continue;
      if (session.policyVersion >= newPolicyVersion) continue;
      const kept = session.approvals.filter((approval) => approval.policyVersion >= newPolicyVersion);
      if (kept.length !== session.approvals.length) {
        session.approvals = kept;
        invalidated += 1;
        await this.sessions.save(session);
      }
    }
    return invalidated;
  }

  getSession(sessionId: string): Promise<CustodySessionRecord | undefined> {
    return this.sessions.get(sessionId);
  }

  private async requireSession(sessionId: string): Promise<CustodySessionRecord> {
    const session = await this.sessions.get(sessionId);
    if (!session) throw new Error("unknown session");
    return session;
  }
}
