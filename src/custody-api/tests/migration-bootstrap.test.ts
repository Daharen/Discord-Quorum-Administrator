import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("migration bootstrap surface", () => {
  it("defines durable custody tables", () => {
    const sql = readFileSync(resolve(process.cwd(), "../../infra/postgres/init.sql"), "utf8");
    expect(sql).toContain("create table if not exists custody_membership");
    expect(sql).toContain("create table if not exists custody_keys");
    expect(sql).toContain("create table if not exists custody_sessions");
    expect(sql).toContain("create table if not exists custody_session_approvals");
    expect(sql).toContain("create table if not exists custody_audit_log");
    expect(sql).toContain("create table if not exists sealed_kits");
  });
});
