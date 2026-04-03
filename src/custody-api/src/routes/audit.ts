import type { FastifyInstance } from "fastify";
import type { CustodyService } from "../services/custody-service.js";

export function registerAuditRoute(app: FastifyInstance, service: CustodyService): void {
  app.get("/audit", async () => ({ entries: await service.listAudit() }));
}
