import test from "node:test";
import assert from "node:assert/strict";

import { canonicalizePayload } from "../src/canonicalize.js";
import { sha256 } from "../src/hash.js";

test("canonical ordering sorts keys recursively and removes undefined", () => {
  const payload = {
    z: 3,
    a: {
      y: 2,
      x: 1,
      omit: undefined,
    },
    b: undefined,
    c: [
      {
        b: 2,
        a: 1,
      },
    ],
  };

  const canonical = canonicalizePayload(payload);

  assert.equal(canonical, '{"a":{"x":1,"y":2},"c":[{"a":1,"b":2}],"z":3}');
});

test("identical payloads produce identical canonical strings", () => {
  const payloadA = {
    sessionId: "s-1",
    payload: { amount: 100, to: "vault" },
    actionType: "transfer",
  };

  const payloadB = {
    actionType: "transfer",
    payload: { to: "vault", amount: 100 },
    sessionId: "s-1",
  };

  assert.equal(canonicalizePayload(payloadA), canonicalizePayload(payloadB));
});

test("hash determinism", () => {
  const canonical = canonicalizePayload({ foo: "bar", n: 10 });
  assert.equal(sha256(canonical), sha256(canonical));
});
