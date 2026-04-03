import { describe, expect, it } from "vitest";
import { SealedKitStore } from "../src/domain/sealed-kit-store.js";
import { InMemorySealedKitRepository } from "../src/repositories/in-memory/in-memory-sealed-kit-repository.js";

const clock = { nowMs: () => 1700000000000 };

describe("sealed kit lifecycle", () => {
  it("stores ciphertext-only and version replacement semantics", async () => {
    const store = new SealedKitStore(new InMemorySealedKitRepository(), clock);

    const first = await store.put("ciphertext-v1", { sessionId: "s1", label: "first" });
    expect(first.version).toBe(1);

    const second = await store.put("ciphertext-v2", { sessionId: "s2", label: "second" });
    expect(second.version).toBe(2);

    expect(await store.getCurrentCiphertext()).toBe("ciphertext-v2");
    expect(await store.getCurrentMetadata()).toEqual({
      version: 2,
      metadata: { sessionId: "s2", label: "second" },
    });
  });
});
