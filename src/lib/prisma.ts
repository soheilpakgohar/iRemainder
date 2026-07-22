import { PrismaClient } from "@prisma/client";

// Prisma client singleton — avoids exhausting connections in dev hot-reload.
// See https://www.prisma.io/docs/guides/nextjs
//
// Connects to Vercel Postgres (Neon) directly via the pooled connection
// string in DATABASE_URL. Vercel serverless functions support TCP, so the
// Prisma Rust engine works without a WebSocket driver adapter.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
