import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalDb = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Set DATABASE_URL (and optionally DATABASE_URL_POOLED) to a PostgreSQL connection string.");
}

const connectionUrl = new URL(connectionString);
if (connectionUrl.searchParams.get("sslmode") === "require") connectionUrl.searchParams.set("sslmode", "verify-full");

export const db = globalDb.prisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: connectionUrl.toString() }),
});
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
