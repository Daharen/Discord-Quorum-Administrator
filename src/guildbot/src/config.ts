import dotenv from "dotenv";

dotenv.config();

export interface GuildBotConfig {
  discordBotToken: string;
  discordApplicationId: string;
  discordGuildId: string;
  discordGovernanceChannelId: string;
  discordAdminRoleId: string;
  guildbotServiceKeyB64: string;
  guildbotServicePublicKeyB64: string;
  governanceQuorumNumerator: number;
  governanceQuorumDenominator: number;
  governanceProposalTtlSeconds: number;
  custodyApiBaseUrl?: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function intWithDefault(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer env var ${name}: ${raw}`);
  }
  return parsed;
}

export function loadConfig(): GuildBotConfig {
  const governanceQuorumNumerator = intWithDefault("GOVERNANCE_QUORUM_NUMERATOR", 2);
  const governanceQuorumDenominator = intWithDefault("GOVERNANCE_QUORUM_DENOMINATOR", 3);

  if (governanceQuorumNumerator >= governanceQuorumDenominator) {
    throw new Error("GOVERNANCE_QUORUM_NUMERATOR must be less than GOVERNANCE_QUORUM_DENOMINATOR");
  }

  return {
    discordBotToken: required("DISCORD_BOT_TOKEN"),
    discordApplicationId: required("DISCORD_APPLICATION_ID"),
    discordGuildId: required("DISCORD_GUILD_ID"),
    discordGovernanceChannelId: required("DISCORD_GOVERNANCE_CHANNEL_ID"),
    discordAdminRoleId: required("DISCORD_ADMIN_ROLE_ID"),
    guildbotServiceKeyB64: required("GUILDBOT_SERVICE_KEY_B64"),
    guildbotServicePublicKeyB64: required("GUILDBOT_SERVICE_PUBLIC_KEY_B64"),
    governanceQuorumNumerator,
    governanceQuorumDenominator,
    governanceProposalTtlSeconds: intWithDefault("GOVERNANCE_PROPOSAL_TTL_SECONDS", 86_400),
    custodyApiBaseUrl: process.env.CUSTODY_API_BASE_URL?.trim() || undefined,
  };
}
