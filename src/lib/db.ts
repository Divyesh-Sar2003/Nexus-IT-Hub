import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getRequiredEnv } from "@/lib/env";

const globalForDatabase = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pool =
  globalForDatabase.pgPool ??
  new Pool({
    connectionString: getRequiredEnv(process.env.DATABASE_URL, "DATABASE_URL"),
    ssl: { rejectUnauthorized: true },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

const adapter = new PrismaPg(pool);
export const db =
  globalForDatabase.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.prisma = db;
  globalForDatabase.pgPool = pool;
}
