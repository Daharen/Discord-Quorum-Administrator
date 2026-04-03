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

export class HttpCustodySyncPublisher implements CustodySyncPublisher {
  constructor(
    private readonly endpoint: string,
    private readonly logger: Logger,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async publishGovernanceEvent(event: SignedGovernanceEvent): Promise<void> {
    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        this.logger.error("custody sync non-success response", {
          endpoint: this.endpoint,
          status: response.status,
          eventId: event.eventId,
        });
      }
    } catch (error: unknown) {
      this.logger.error("custody sync publish failed", {
        endpoint: this.endpoint,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
