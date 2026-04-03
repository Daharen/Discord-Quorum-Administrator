import type { SignedGuildBotEventEnvelope } from "../types.js";
import { GuildBotEventVerifier } from "../crypto/guildbot-event-verifier.js";
import { MembershipRegistry } from "../domain/membership-registry.js";
import { KeyRegistry } from "../domain/key-registry.js";
import { SessionEngine } from "../domain/session-engine.js";
import { AuditLog } from "../domain/audit-log.js";

export class CustodyService {
  constructor(
    private readonly verifier: GuildBotEventVerifier,
    private readonly membershipRegistry: MembershipRegistry,
    private readonly keyRegistry: KeyRegistry,
    private readonly sessionEngine: SessionEngine,
    private readonly audit: AuditLog,
  ) {}

  ingestBotEvent(event: SignedGuildBotEventEnvelope): void {
    this.verifier.verify(event);
    const changed = this.membershipRegistry.applyMembershipEvent(event);
    if (event.eventType === "administrator_removed") {
      const discordUserId = String(event.payload.discordUserId);
      this.keyRegistry.revokeAllForRemovedCustodian(discordUserId);
    }
    this.sessionEngine.invalidateSupersededApprovals(changed.policyVersion);
    this.audit.append("guildbot_event", event.eventId, { eventType: event.eventType, payloadHash: event.payloadHash });
  }

  registerKey(discordUserId: string, publicKeyB64: string): { keyId: string } {
    const keyId = this.keyRegistry.registerKey(discordUserId, publicKeyB64);
    this.audit.append("key_registered", keyId, { discordUserId });
    return { keyId };
  }

  createSession(scope: string, actionType: string, payloadData: Record<string, unknown>) {
    const session = this.sessionEngine.createSession(scope, actionType, payloadData);
    this.audit.append("session_created", session.sessionId, { scope, actionType, requiredThreshold: session.requiredThreshold });
    return session;
  }

  approveSession(sessionId: string, signerDiscordUserId: string, signatureB64: string) {
    const session = this.sessionEngine.submitApproval(sessionId, signerDiscordUserId, signatureB64);
    this.audit.append("session_approval", sessionId, { signerDiscordUserId, status: session.status });
    return session;
  }

  getSession(sessionId: string) {
    return this.sessionEngine.getSession(sessionId);
  }

  listAudit() {
    return this.audit.list();
  }
}
