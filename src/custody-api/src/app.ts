import Fastify from "fastify";
import type { CustodyConfig } from "./config.js";
import { SystemClock } from "./util/clock.js";
import { InMemoryMembershipRepository } from "./repositories/in-memory/in-memory-membership-repository.js";
import { InMemoryKeyRepository } from "./repositories/in-memory/in-memory-key-repository.js";
import { InMemorySessionRepository } from "./repositories/in-memory/in-memory-session-repository.js";
import { InMemoryAuditRepository } from "./repositories/in-memory/in-memory-audit-repository.js";
import { MembershipRegistry } from "./domain/membership-registry.js";
import { KeyRegistry } from "./domain/key-registry.js";
import { SessionEngine } from "./domain/session-engine.js";
import { AuditLog } from "./domain/audit-log.js";
import { GuildBotEventVerifier } from "./crypto/guildbot-event-verifier.js";
import { CustodyService } from "./services/custody-service.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerBotEventsRoute } from "./routes/bot-events.js";
import { registerKeysRoute } from "./routes/keys.js";
import { registerSessionsRoute } from "./routes/sessions.js";
import { registerAuditRoute } from "./routes/audit.js";

export function buildApp(config: CustodyConfig) {
  const app = Fastify();
  const clock = new SystemClock();

  const membershipRepo = new InMemoryMembershipRepository();
  const keyRepo = new InMemoryKeyRepository();
  const sessionRepo = new InMemorySessionRepository();
  const auditRepo = new InMemoryAuditRepository();

  const membershipRegistry = new MembershipRegistry(
    membershipRepo,
    {
      numerator: config.defaultThresholdNumerator,
      denominator: config.defaultThresholdDenominator,
    },
    clock,
  );

  const keyRegistry = new KeyRegistry(keyRepo, membershipRegistry, clock);
  const sessionEngine = new SessionEngine(
    sessionRepo,
    membershipRegistry,
    keyRegistry,
    clock,
    config.sessionTtlSeconds,
  );

  const auditLog = new AuditLog(auditRepo, clock);

  const verifier = new GuildBotEventVerifier(
    config.guildIdAllowlist,
    config.botPublicKeyB64,
    config.eventMaxSkewMs,
    clock,
  );

  const service = new CustodyService(verifier, membershipRegistry, keyRegistry, sessionEngine, auditLog);

  registerHealthRoute(app);
  registerBotEventsRoute(app, service);
  registerKeysRoute(app, service);
  registerSessionsRoute(app, service);
  registerAuditRoute(app, service);

  return app;
}
