import { createServer } from "node:http";
import { describe, expect, it, vi } from "vitest";
import { HttpCustodySyncPublisher } from "../src/governance/custody-sync.js";

describe("HttpCustodySyncPublisher", () => {
  it("posts governance events to custody API endpoint", async () => {
    const calls: string[] = [];
    const server = createServer((req, res) => {
      if (req.method === "POST" && req.url === "/bot/events") {
        calls.push("hit");
        res.statusCode = 202;
        res.end("ok");
        return;
      }
      res.statusCode = 404;
      res.end("missing");
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("unexpected address");
    }

    const logger = { info: vi.fn(), error: vi.fn() };
    const publisher = new HttpCustodySyncPublisher(`http://127.0.0.1:${address.port}/bot/events`, logger);

    await publisher.publishGovernanceEvent({
      eventId: "e1",
      eventType: "proposal_resolved",
      issuedAtMs: 1,
      nonce: "n",
      payload: { x: 1 },
      payloadHash: "h",
      publicKey: "k",
      signature: "s",
    });

    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));

    expect(calls).toHaveLength(1);
  });

  it("fails safely without throwing", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("down"));
    const logger = { info: vi.fn(), error: vi.fn() };
    const publisher = new HttpCustodySyncPublisher(
      "http://localhost:9999/bot/events",
      logger,
      fetchMock as unknown as typeof fetch,
    );

    await expect(
      publisher.publishGovernanceEvent({
        eventId: "e1",
        eventType: "proposal_resolved",
        issuedAtMs: 1,
        nonce: "n",
        payload: { x: 1 },
        payloadHash: "h",
        publicKey: "k",
        signature: "s",
      }),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalled();
  });
});
