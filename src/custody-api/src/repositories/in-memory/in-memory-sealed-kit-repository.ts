import type { SealedKitRecord, SealedKitRepository } from "../interfaces.js";

export class InMemorySealedKitRepository implements SealedKitRepository {
  private current: SealedKitRecord | undefined;

  async upsert(record: SealedKitRecord): Promise<void> {
    this.current = record;
  }

  async getCurrent(): Promise<SealedKitRecord | undefined> {
    return this.current;
  }
}
