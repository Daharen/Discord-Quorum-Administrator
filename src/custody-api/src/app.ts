import Fastify from "fastify";
import type { CustodyConfig } from "./config.js";
import { SystemClock } from "./util/clock.js";
import { InMemoryMembershipRepository } from "./repositories/in-memory/in-memory-membership-repository.js";
import { InMemoryKeyRepository } from "./repositories/in-memory/in-memory-key-repository.js";
import { InMemorySessionRepository } from "./repositories/in-memory/in-memory-session-repository.js";
import { InMemoryAuditRepository } from "./repositories/in-memory/in-memory-audit-repository.js";
import { PostgresClient } from "./repositories/postgres/client.js";
import { migrate } from "./repositories/postgres/migrate.js";
import {
  PostgresAuditRepository,
  PostgresKeyRepository,
  PostgresMembershipRepository,
  PostgresSessionRepository,
} from "./repositories/postgres/postgres-repositories.js";
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

export async function buildApp(config: CustodyConfig) {
  const app = Fastify();
  const clock = new SystemClock();

  let membershipRepo = new InMemoryMembershipRepository();
  let keyRepo = new InMemoryKeyRepository();
  let sessionRepo = new InMemorySessionRepository();
  let auditRepo = new InMemoryAuditRepository();
  let postgres: PostgresClient | undefined;

  if (config.repositoryMode === "postgres" && config.databaseUrl) {
    postgres = new PostgresClient(config.databaseUrl);
    await migrate(postgres);
    membershipRepo = new PostgresMembershipRepository(postgres);
    keyRepo = new PostgresKeyRepository(postgres);
    sessionRepo = new PostgresSessionRepository(postgres);
    auditRepo = new PostgresAuditRepository(postgres);
  }

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

  registerHealthRoute(app, async () => {
    if (!postgres) return true;
    await postgres.query("select 1");
    return true;
  });
  registerBotEventsRoute(app, service);
  registerKeysRoute(app, service);
  registerSessionsRoute(app, service);
  registerAuditRoute(app, service);

  app.addHook("onClose", async () => {
    await postgres?.close();
  });

  return app;
}
