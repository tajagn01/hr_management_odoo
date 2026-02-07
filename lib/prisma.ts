import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? [{ emit: 'event', level: 'query' }, "error", "warn"]
      : ["error"],
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000,
    },
  });

  // Log slow queries only
  if (process.env.NODE_ENV === "development") {
    client.$on('query' as never, (e: any) => {
      if (e.duration > 1000) {
        console.warn(`⚠️ Slow query: ${e.query} took ${e.duration}ms`);
      }
    });
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

