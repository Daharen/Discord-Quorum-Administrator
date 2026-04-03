import type { FastifyInstance } from "fastify";

export function registerHealthRoute(
  app: FastifyInstance,
  checkReadiness: () => Promise<boolean> = async () => true,
): void {
  app.get("/health", async () => ({ ok: true, ready: await checkReadiness() }));
}
