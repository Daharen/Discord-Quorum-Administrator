import dotenv from "dotenv";

dotenv.config();

export interface CustodyConfig {
  port: number;
  bindHost: string;
  botPublicKeyB64: string;
  guildIdAllowlist: Set<string>;
  defaultThresholdNumerator: number;
  defaultThresholdDenominator: number;
  sessionTtlSeconds: number;
  encryptionMasterKeyB64: string;
  auditDir: string;
  eventMaxSkewMs: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function positiveInt(name: string): number {
  const value = Number.parseInt(required(name), 10);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid ${name}`);
  return value;
}

export function loadConfig(): CustodyConfig {
  const numerator = positiveInt("CUSTODY_API_DEFAULT_THRESHOLD_NUMERATOR");
  const denominator = positiveInt("CUSTODY_API_DEFAULT_THRESHOLD_DENOMINATOR");
  if (numerator >= denominator) {
    throw new Error("CUSTODY_API_DEFAULT_THRESHOLD_NUMERATOR must be < denominator");
  }
  return {
    port: positiveInt("CUSTODY_API_PORT"),
    bindHost: required("CUSTODY_API_BIND_HOST"),
    botPublicKeyB64: required("CUSTODY_API_BOT_PUBLIC_KEY_B64"),
    guildIdAllowlist: new Set(
      required("CUSTODY_API_GUILD_ID_ALLOWLIST")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
    defaultThresholdNumerator: numerator,
    defaultThresholdDenominator: denominator,
    sessionTtlSeconds: positiveInt("CUSTODY_API_SESSION_TTL_SECONDS"),
    encryptionMasterKeyB64: required("CUSTODY_API_ENCRYPTION_MASTER_KEY_B64"),
    auditDir: required("CUSTODY_API_AUDIT_DIR"),
    eventMaxSkewMs: 120_000,
  };
}
