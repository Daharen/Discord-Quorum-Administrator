import { mkdirSync, readFileSync, appendFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { canonicalizePayload, sha256 } from "../../../crypto-core/src/index.js";
import { AUDIT_LOG_VERSION } from "./constants.js";
import type { SignedGovernanceEvent } from "../types.js";

export interface AuditRecord {
  auditVersion: number;
  sequence: number;
  timestampMs: number;
  eventHash: string;
  previousAuditRecordHash: string | null;
  signedEvent: SignedGovernanceEvent;
}

export class AuditLog {
  private sequence = 0;
  private previousAuditRecordHash: string | null = null;

  constructor(private readonly logPath: string) {
    mkdirSync(dirname(logPath), { recursive: true });
    this.bootstrapState();
  }

  append(event: SignedGovernanceEvent, timestampMs: number): AuditRecord {
    this.sequence += 1;
    const eventHash = sha256(canonicalizePayload(event));
    const record: AuditRecord = {
      auditVersion: AUDIT_LOG_VERSION,
      sequence: this.sequence,
      timestampMs,
      eventHash,
      previousAuditRecordHash: this.previousAuditRecordHash,
      signedEvent: event,
    };

    appendFileSync(this.logPath, `${JSON.stringify(record)}\n`, "utf8");
    this.previousAuditRecordHash = sha256(canonicalizePayload(record));
    return record;
  }

  private bootstrapState(): void {
    if (!existsSync(this.logPath)) {
      return;
    }

    const lines = readFileSync(this.logPath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return;
    }

    const last = JSON.parse(lines[lines.length - 1]) as AuditRecord;
    this.sequence = last.sequence;
    this.previousAuditRecordHash = sha256(canonicalizePayload(last));
  }
}
