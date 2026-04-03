import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const files = [
  "src/domain/audit-log.ts",
  "src/domain/session-engine.ts",
  "src/crypto/guildbot-event-verifier.ts",
];

describe("package boundary hardening", () => {
  it("uses crypto-core package import surface", () => {
    for (const file of files) {
      const content = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(content).toContain('from "crypto-core"');
      expect(content).not.toContain("crypto-core/src/index");
    }
  });
});
