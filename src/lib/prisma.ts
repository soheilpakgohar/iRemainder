import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Prisma client singleton — avoids exhausting connections in dev hot-reload.
// See https://www.prisma.io/docs/guides/nextjs
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // In Vercel production, use the Neon serverless Pool with the
  // PrismaNeon adapter (WebSocket transport — no TCP needed).
  // Locally, Prisma's built-in connection pool over TCP works fine.
  if (process.env.NODE_ENV === "production") {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter } as never);
  }

  return new PrismaClient({
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
