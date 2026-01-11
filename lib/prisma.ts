import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const client = new PrismaClient({
    // ✅ FIX: Only log errors in development to improve performance
    log: process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"],
    // Add transaction timeout
    transactionOptions: {
      maxWait: 10000, // 10 seconds max wait for transaction
      timeout: 30000, // 30 seconds transaction timeout
    },
  });

  // Add middleware for query timing (helps debug slow queries)
  client.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();

    // Log slow queries (over 2 seconds)
    if (after - before > 2000) {
      console.warn(`⚠️ Slow query: ${params.model}.${params.action} took ${after - before}ms`);
    }

    return result;
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

