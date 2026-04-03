import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = buildApp(config);

  await app.listen({
    host: config.bindHost,
    port: config.port,
  });
}

main().catch((error: unknown) => {
  console.error("custody-api failed to start", error);
  process.exit(1);
});
