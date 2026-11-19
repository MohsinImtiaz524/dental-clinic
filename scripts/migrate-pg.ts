import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const migrationsDirectory = path.resolve("prisma/migrations-postgresql");
const rawConnectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!rawConnectionString) throw new Error("Set DIRECT_DATABASE_URL or DATABASE_URL before running migrations.");

// pg 8 currently treats `require` as full certificate verification, but warns
// that its meaning changes in pg 9. Preserve the secure behavior explicitly.
const connectionUrl = new URL(rawConnectionString);
if (connectionUrl.searchParams.get("sslmode") === "require") connectionUrl.searchParams.set("sslmode", "verify-full");
connectionUrl.searchParams.delete("channel_binding");

const client = new Client({ connectionString: connectionUrl.toString() });

async function main() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);

  const entries = (await readdir(migrationsDirectory, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  for (const migrationName of entries) {
    const existing = await client.query<{ checksum: string; finished_at: Date | null }>(
      `SELECT "checksum", "finished_at" FROM "_prisma_migrations" WHERE "migration_name" = $1 AND "rolled_back_at" IS NULL`,
      [migrationName],
    );
    const sql = await readFile(path.join(migrationsDirectory, migrationName, "migration.sql"), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");

    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Migration ${migrationName} was changed after it was applied.`);
      if (!existing.rows[0].finished_at) throw new Error(`Migration ${migrationName} previously failed and requires manual review.`);
      console.log(`Already applied: ${migrationName}`);
      continue;
    }

    const id = randomUUID();
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count") VALUES ($1, $2, now(), $3, 1)`,
        [id, checksum, migrationName],
      );
      await client.query("COMMIT");
      console.log(`Applied: ${migrationName}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

main()
  .catch(error => {
    const message = error instanceof Error ? error.message : "Unknown migration error";
    console.error(`Database migration failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(() => client.end());
