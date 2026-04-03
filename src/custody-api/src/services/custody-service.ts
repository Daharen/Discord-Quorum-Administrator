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

  async ingestBotEvent(event: SignedGuildBotEventEnvelope): Promise<void> {
    this.verifier.verify(event);
    const changed = await this.membershipRegistry.applyMembershipEvent(event);
    if (event.eventType === "administrator_removed") {
      const discordUserId = String(event.payload.discordUserId);
      await this.keyRegistry.revokeAllForRemovedCustodian(discordUserId);
    }
    await this.sessionEngine.invalidateSupersededApprovals(changed.policyVersion);
    await this.audit.append("guildbot_event", event.eventId, { eventType: event.eventType, payloadHash: event.payloadHash });
  }

  async registerKey(discordUserId: string, publicKeyB64: string): Promise<{ keyId: string }> {
    const keyId = await this.keyRegistry.registerKey(discordUserId, publicKeyB64);
    await this.audit.append("key_registered", keyId, { discordUserId });
    return { keyId };
  }

  async createSession(scope: string, actionType: string, payloadData: Record<string, unknown>) {
    const session = await this.sessionEngine.createSession(scope, actionType, payloadData);
    await this.audit.append("session_created", session.sessionId, { scope, actionType, requiredThreshold: session.requiredThreshold });
    return session;
  }

  async approveSession(sessionId: string, signerDiscordUserId: string, signatureB64: string) {
    const session = await this.sessionEngine.submitApproval(sessionId, signerDiscordUserId, signatureB64);
    await this.audit.append("session_approval", sessionId, { signerDiscordUserId, status: session.status });
    return session;
  }

  getSession(sessionId: string) {
    return this.sessionEngine.getSession(sessionId);
  }

  listAudit() {
    return this.audit.list();
  }
}
