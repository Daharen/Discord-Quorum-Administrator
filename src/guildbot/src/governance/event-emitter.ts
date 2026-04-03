import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";
import {
  canonicalizePayload,
  generateNonce,
  sha256,
  signPayload,
  verifySignature,
} from "crypto-core";
import { GOVERNANCE_EVENT_VERSION } from "./constants.js";
import { deriveEventId } from "../util/ids.js";
import type { GovernanceEventType, SignedGovernanceEvent } from "../types.js";

export interface GovernanceEventInput {
  eventType: GovernanceEventType;
  issuedAtMs: number;
  guildId: string;
  payload: Record<string, unknown>;
  proposalId?: string;
  actorDiscordUserId?: string;
  nonce?: string;
}

export class GovernanceEventEmitter {
  constructor(
    private readonly privateKey: KeyObject,
    private readonly publicKey: KeyObject,
  ) {}

  static fromBase64DerKeys(privateKeyB64: string, publicKeyB64: string): GovernanceEventEmitter {
    const privateKey = createPrivateKey({
      key: Buffer.from(privateKeyB64, "base64"),
      format: "der",
      type: "pkcs8",
    });
    const publicKey = createPublicKey({
      key: Buffer.from(publicKeyB64, "base64"),
      format: "der",
      type: "spki",
    });

    return new GovernanceEventEmitter(privateKey, publicKey);
  }

  emit(input: GovernanceEventInput): SignedGovernanceEvent {
    const issuedAtMs = input.issuedAtMs;
    const nonce = input.nonce ?? generateNonce();
    const canonicalPayload = {
      eventType: input.eventType,
      eventVersion: GOVERNANCE_EVENT_VERSION,
      issuedAtMs,
      nonce,
      guildId: input.guildId,
      proposalId: input.proposalId,
      actorDiscordUserId: input.actorDiscordUserId,
      payload: input.payload,
    };

    const payloadHash = sha256(canonicalizePayload(canonicalPayload));
    const envelope = signPayload(canonicalPayload, this.privateKey, this.publicKey);

    return {
      eventId: deriveEventId(payloadHash, envelope.signature),
      eventType: input.eventType,
      issuedAtMs,
      nonce,
      payload: canonicalPayload,
      payloadHash,
      publicKey: envelope.publicKey,
      signature: envelope.signature,
    };
  }

  verify(event: SignedGovernanceEvent): boolean {
    return verifySignature(event.payload, {
      payloadHash: event.payloadHash,
      publicKey: event.publicKey,
      signature: event.signature,
    });
  }
}
