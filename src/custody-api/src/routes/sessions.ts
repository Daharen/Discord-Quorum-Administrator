import type { FastifyInstance } from "fastify";
import type { CustodyService } from "../services/custody-service.js";

interface CreateSessionBody {
  scope: string;
  actionType: string;
  payload: Record<string, unknown>;
}

interface ApproveSessionBody {
  signerDiscordUserId: string;
  signatureB64: string;
}

export function registerSessionsRoute(app: FastifyInstance, service: CustodyService): void {
  app.post<{ Body: CreateSessionBody }>("/sessions/create", async (request, reply) => {
    const session = service.createSession(request.body.scope, request.body.actionType, request.body.payload);
    return reply.code(201).send(session);
  });

  app.post<{ Params: { sessionId: string }; Body: ApproveSessionBody }>(
    "/sessions/:sessionId/approve",
    async (request, reply) => {
      const session = service.approveSession(
        request.params.sessionId,
        request.body.signerDiscordUserId,
        request.body.signatureB64,
      );
      return reply.code(200).send(session);
    },
  );

  app.get<{ Params: { sessionId: string } }>("/sessions/:sessionId", async (request, reply) => {
    const session = service.getSession(request.params.sessionId);
    if (!session) {
      return reply.code(404).send({ error: "not_found" });
    }
    return reply.send(session);
  });
}
