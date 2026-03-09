import {
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";
import { canonicalizePayload } from "./canonicalize.js";
import { sha256 } from "./hash.js";
import type { SignatureEnvelope } from "./types.js";

export function generateKeyPair(): { publicKey: KeyObject; privateKey: KeyObject } {
  return generateKeyPairSync("ed25519");
}

function toBase64DerPublicKey(publicKey: KeyObject): string {
  return publicKey.export({ format: "der", type: "spki" }).toString("base64");
}

function parseBase64DerPublicKey(value: string): KeyObject {
  return createPublicKey({
    key: Buffer.from(value, "base64"),
    format: "der",
    type: "spki",
  });
}

export function signPayload(
  payload: object,
  privateKey: KeyObject,
  publicKey: KeyObject,
): SignatureEnvelope {
  const canonicalPayload = canonicalizePayload(payload);
  const payloadHash = sha256(canonicalPayload);

  const signature = sign(null, Buffer.from(canonicalPayload, "utf8"), privateKey).toString(
    "base64",
  );

  return {
    payloadHash,
    publicKey: toBase64DerPublicKey(publicKey),
    signature,
  };
}

export function verifySignature(payload: object, envelope: SignatureEnvelope): boolean {
  const canonicalPayload = canonicalizePayload(payload);
  const payloadHash = sha256(canonicalPayload);

  if (payloadHash !== envelope.payloadHash) {
    return false;
  }

  const publicKey = parseBase64DerPublicKey(envelope.publicKey);

  return verify(
    null,
    Buffer.from(canonicalPayload, "utf8"),
    publicKey,
    Buffer.from(envelope.signature, "base64"),
  );
}
