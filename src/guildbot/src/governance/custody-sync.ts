import type { SignedGovernanceEvent } from "../types.js";
import type { Logger } from "../util/logger.js";

export interface CustodySyncPublisher {
  publishGovernanceEvent(event: SignedGovernanceEvent): Promise<void>;
}

export class NoopCustodySyncPublisher implements CustodySyncPublisher {
  constructor(private readonly logger: Logger) {}

  async publishGovernanceEvent(event: SignedGovernanceEvent): Promise<void> {
    this.logger.info("No-op custody sync publish", {
      eventId: event.eventId,
      eventType: event.eventType,
    });
  }
}
