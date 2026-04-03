import { resolve } from "node:path";
import { loadConfig } from "./config.js";
import { createDiscordClient } from "./discord/client.js";
import { CommandRouter } from "./discord/command-router.js";
import { AuditLog } from "./governance/audit-log.js";
import { GovernanceCommandHandlers } from "./governance/command-handlers.js";
import { NoopCustodySyncPublisher } from "./governance/custody-sync.js";
import { GovernanceEventEmitter } from "./governance/event-emitter.js";
import { ProposalEngine } from "./governance/proposal-engine.js";
import { ProposalStore } from "./governance/proposal-store.js";
import { VoteRegistry } from "./governance/vote-registry.js";
import { SystemClock } from "./util/clock.js";
import { ConsoleLogger } from "./util/logger.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const clock = new SystemClock();
  const logger = new ConsoleLogger("guildbot");

  const eventEmitter = GovernanceEventEmitter.fromBase64DerKeys(
    config.guildbotServiceKeyB64,
    config.guildbotServicePublicKeyB64,
  );

  const engine = new ProposalEngine(
    {
      quorumNumerator: config.governanceQuorumNumerator,
      quorumDenominator: config.governanceQuorumDenominator,
      proposalTtlSeconds: config.governanceProposalTtlSeconds,
    },
    clock,
    new ProposalStore(),
    new VoteRegistry(),
    eventEmitter,
    new AuditLog(resolve("runtime/audit/governance.ndjson")),
    logger,
    new NoopCustodySyncPublisher(logger),
  );

  const handlers = new GovernanceCommandHandlers(
    engine,
    config.governanceQuorumNumerator,
    config.governanceQuorumDenominator,
  );

  const router = new CommandRouter(
    config.discordGovernanceChannelId,
    config.discordAdminRoleId,
    handlers,
  );

  const client = createDiscordClient(router, logger);
  await client.login(config.discordBotToken);
}

main().catch((error: unknown) => {
  console.error("GuildBot failed to start", error);
  process.exit(1);
});
