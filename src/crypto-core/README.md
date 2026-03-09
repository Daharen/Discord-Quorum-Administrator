# Crypto Core

Responsibility: canonical message formats, signature envelopes, hashing procedures, and verification rules.

All inter-component authentication relies on canonicalization.

## Implementation

The Crypto Core is implemented in TypeScript for Node.js and provides deterministic cryptographic primitives with no Discord, custody API, or governance business logic dependencies.

### Canonical payload model

Canonical payloads contain:

- `actionType`
- `sessionId`
- `timestamp`
- `nonce`
- `payload`
- `policyVersion`

Canonicalization rules:

1. Recursively sort object keys.
2. Remove `undefined` fields.
3. Serialize as UTF-8 JSON.

### Exposed primitives

- `createPayload()` to build replay-safe payloads with timestamp and nonce.
- `canonicalizePayload()` to produce deterministic signing input.
- `sha256()` for deterministic payload hashing.
- `generateNonce()` for replay protection.
- `generateKeyPair()` for Ed25519 key generation.
- `signPayload()` to produce signature envelopes.
- `verifySignature()` to validate payload hash and signature integrity.

### Signature envelope

`signPayload()` returns:

- `payloadHash` (SHA-256 hex digest of canonical payload)
- `publicKey` (base64-encoded DER SPKI)
- `signature` (base64 Ed25519 signature)
