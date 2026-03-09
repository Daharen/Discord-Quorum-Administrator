import test from "node:test";
import assert from "node:assert/strict";

import { generateKeyPair, signPayload, verifySignature } from "../src/signing.js";

test("signature verification succeeds for untampered payload", () => {
  const { publicKey, privateKey } = generateKeyPair();
  const payload = {
    actionType: "governance.proposal.approve",
    sessionId: "session-001",
    timestamp: 1710000000000,
    nonce: "abcd1234",
    payload: { proposalId: "p-1", decision: "approve" },
    policyVersion: 1,
  };

  const envelope = signPayload(payload, privateKey, publicKey);
  assert.equal(verifySignature(payload, envelope), true);
});

test("invalid signature is rejected", () => {
  const { publicKey, privateKey } = generateKeyPair();
  const payload = {
    actionType: "governance.proposal.reject",
    sessionId: "session-002",
    timestamp: 1710000000001,
    nonce: "ff22",
    payload: { proposalId: "p-2", decision: "reject" },
    policyVersion: 1,
  };

  const envelope = signPayload(payload, privateKey, publicKey);
  envelope.signature = envelope.signature.slice(0, -2) + "ab";

  assert.equal(verifySignature(payload, envelope), false);
});

test("tampered payload is rejected", () => {
  const { publicKey, privateKey } = generateKeyPair();
  const payload = {
    actionType: "custody.transfer",
    sessionId: "session-003",
    timestamp: 1710000000002,
    nonce: "0099",
    payload: { amount: 5, destination: "safe" },
    policyVersion: 1,
  };

  const envelope = signPayload(payload, privateKey, publicKey);
  const tamperedPayload = {
    ...payload,
    payload: { amount: 50, destination: "safe" },
  };

  assert.equal(verifySignature(tamperedPayload, envelope), false);
});
