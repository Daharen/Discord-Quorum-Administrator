import type { SealedKitRecord, SealedKitRepository } from "../interfaces.js";

export class InMemorySealedKitRepository implements SealedKitRepository {
  private current: SealedKitRecord | undefined;

  upsert(record: SealedKitRecord): void {
    this.current = record;
  }

  getCurrent(): SealedKitRecord | undefined {
    return this.current;
  }
}
