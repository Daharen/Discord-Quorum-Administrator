import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PostgresClient } from "./client.js";

const MIGRATION_PATH_CANDIDATES = [
  resolve(process.cwd(), "infra/postgres/init.sql"),
  resolve(process.cwd(), "../../infra/postgres/init.sql"),
];

export async function migrate(db: PostgresClient): Promise<void> {
  for (const sqlPath of MIGRATION_PATH_CANDIDATES) {
    try {
      const sql = await readFile(sqlPath, "utf8");
      await db.query(sql);
      return;
    } catch {
      // try next candidate
    }
  }
  throw new Error("Unable to locate infra/postgres/init.sql migration file");
}
