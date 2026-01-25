import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Public endpoint to get list of managers for registration
export async function GET() {
    try {
        const managers = await prisma.employee.findMany({
            where: {
                user: {
                    role: {
                        in: ["MANAGER", "ADMIN"],
                    },
                },
            },
            select: {
                id: true,
                fullName: true,
                designation: true,
            },
        });

        return NextResponse.json(managers);
    } catch (error) {
        logger.error("Error fetching managers", error);
        return NextResponse.json(
            { error: "Failed to fetch managers" },
            { status: 500 }
        );
    }
}
