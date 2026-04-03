import type { SealedKitRepository } from "../repositories/interfaces.js";
import type { Clock } from "../util/clock.js";

export class SealedKitStore {
  constructor(
    private readonly repository: SealedKitRepository,
    private readonly clock: Clock,
  ) {}

  put(ciphertextB64: string, metadata: Record<string, unknown>): { version: number } {
    const current = this.repository.getCurrent();
    const version = (current?.version ?? 0) + 1;
    this.repository.upsert({ version, ciphertextB64, metadata, updatedAtMs: this.clock.nowMs() });
    return { version };
  }

  getCurrentMetadata(): { version: number; metadata: Record<string, unknown> } | undefined {
    const current = this.repository.getCurrent();
    if (!current) return undefined;
    return { version: current.version, metadata: current.metadata };
  }

  getCurrentCiphertext(): string | undefined {
    return this.repository.getCurrent()?.ciphertextB64;
  }
}
