import type { FastifyInstance } from "fastify";
import type { CustodyService } from "../services/custody-service.js";
import type { SignedGuildBotEventEnvelope } from "../types.js";

export function registerBotEventsRoute(app: FastifyInstance, service: CustodyService): void {
  app.post<{ Body: SignedGuildBotEventEnvelope }>("/bot/events", async (request, reply) => {
    service.ingestBotEvent(request.body);
    return reply.code(202).send({ accepted: true });
  });
}
