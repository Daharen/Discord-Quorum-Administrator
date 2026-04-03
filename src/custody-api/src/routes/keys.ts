import type { FastifyInstance } from "fastify";
import type { CustodyService } from "../services/custody-service.js";

interface RegisterKeyBody {
  discordUserId: string;
  publicKeyB64: string;
}

export function registerKeysRoute(app: FastifyInstance, service: CustodyService): void {
  app.post<{ Body: RegisterKeyBody }>("/keys/register", async (request, reply) => {
    const result = await service.registerKey(request.body.discordUserId, request.body.publicKeyB64);
    return reply.code(201).send(result);
  });
}
