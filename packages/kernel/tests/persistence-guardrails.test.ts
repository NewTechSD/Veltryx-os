import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function sources(directory: string): string[] { const files: string[] = []; for (const entry of readdirSync(directory, { withFileTypes: true })) { const path = resolve(directory, entry.name); if (entry.isDirectory()) { if (!["node_modules", "dist", "coverage"].includes(entry.name)) files.push(...sources(path)); } else if (entry.isFile() && entry.name.endsWith(".ts")) files.push(path); } return files; }

describe("Persistence dependency guardrails", () => {
  it("keeps database, ORM, driver and raw SQL coupling out of Kernel and Contracts", () => {
    const workspace = resolve(process.cwd(), "../..");
    const forbiddenImport = /from\s+["'](?:@prisma\/client|pg|postgres|mysql|sqlite|mongodb|mongoose|typeorm|sequelize|knex)["']/i;
    const forbiddenCode = /PrismaClient|DATABASE_URL|connectionString|\bsql`|\b(?:SELECT|INSERT|UPDATE|DELETE)\s+.+\s+(?:FROM|INTO|SET)\b/i;
    for (const folder of ["packages/kernel/src", "packages/contracts/src"]) for (const file of sources(resolve(workspace, folder))) { const source = readFileSync(file, "utf8"); expect(source).not.toMatch(forbiddenImport); expect(source).not.toMatch(forbiddenCode); }
  });
});
