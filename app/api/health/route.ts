import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health Check Endpoint
 * Returns system status, database connectivity, and version info
 * Used by monitoring tools and load balancers
 */
export async function GET() {
    const startTime = Date.now();

    try {
        // Check database connectivity
        await prisma.$queryRaw`SELECT 1`;

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: "connected",
                responseTime: `${responseTime}ms`
            },
            version: process.env.npm_package_version || "1.0.0",
            environment: process.env.NODE_ENV || "development"
        }, { status: 200 });

    } catch (error) {
        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: "disconnected",
                responseTime: `${responseTime}ms`,
                error: error instanceof Error ? error.message : "Unknown error"
            },
            version: process.env.npm_package_version || "1.0.0",
            environment: process.env.NODE_ENV || "development"
        }, { status: 503 });
    }
}
