import type { SealedKitRepository } from "../repositories/interfaces.js";
import type { Clock } from "../util/clock.js";

export class SealedKitStore {
  constructor(
    private readonly repository: SealedKitRepository,
    private readonly clock: Clock,
  ) {}

  async put(ciphertextB64: string, metadata: Record<string, unknown>): Promise<{ version: number }> {
    const current = await this.repository.getCurrent();
    const version = (current?.version ?? 0) + 1;
    await this.repository.upsert({ version, ciphertextB64, metadata, updatedAtMs: this.clock.nowMs() });
    return { version };
  }

  async getCurrentMetadata(): Promise<{ version: number; metadata: Record<string, unknown> } | undefined> {
    const current = await this.repository.getCurrent();
    if (!current) return undefined;
    return { version: current.version, metadata: current.metadata };
  }

  async getCurrentCiphertext(): Promise<string | undefined> {
    return (await this.repository.getCurrent())?.ciphertextB64;
  }
}
