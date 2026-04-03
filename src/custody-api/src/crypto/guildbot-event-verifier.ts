import { canonicalizePayload, sha256, verifySignature } from "../../../crypto-core/src/index.js";
import type { SignedGuildBotEventEnvelope } from "../types.js";
import type { Clock } from "../util/clock.js";

const ALLOWED_EVENT_TYPES = new Set([
  "administrator_promoted",
  "administrator_removed",
  "proposal_resolved",
  "recovery_session_initiated",
]);

export class GuildBotEventVerifier {
  private readonly seenIds = new Set<string>();
  private readonly seenHashes = new Set<string>();

  constructor(
    private readonly guildAllowlist: Set<string>,
    private readonly expectedPublicKey: string,
    private readonly maxSkewMs: number,
    private readonly clock: Clock,
  ) {}

  verify(event: SignedGuildBotEventEnvelope): void {
    if (!ALLOWED_EVENT_TYPES.has(event.eventType)) throw new Error("unsupported event type");
    if (!event.nonce) throw new Error("nonce required");
    if (!this.guildAllowlist.has(event.guildId)) throw new Error("guild not allowed");
    if (event.publicKey !== this.expectedPublicKey) throw new Error("unexpected signer key");

    const age = Math.abs(this.clock.nowMs() - event.issuedAtMs);
    if (age > this.maxSkewMs) throw new Error("stale event timestamp");

    const computedHash = sha256(canonicalizePayload(event.payload));
    if (computedHash !== event.payloadHash) throw new Error("payload hash mismatch");

    if (this.seenIds.has(event.eventId) || this.seenHashes.has(event.payloadHash)) {
      throw new Error("replay detected");
    }

    const valid = verifySignature(event.payload, {
      payloadHash: event.payloadHash,
      publicKey: event.publicKey,
      signature: event.signature,
    });
    if (!valid) throw new Error("invalid signature");

    this.seenIds.add(event.eventId);
    this.seenHashes.add(event.payloadHash);
  }
}
