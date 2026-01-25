import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all active managers
        const managers = await prisma.employee.findMany({
            where: {
                user: {
                    role: "MANAGER",
                    isActive: true
                }
            },
            select: {
                id: true,
                fullName: true,
                department: true,
                designation: true,
                employeeCode: true
            },
            orderBy: {
                fullName: "asc"
            }
        });

        return NextResponse.json({ managers });
    } catch (error) {
        console.error("Error fetching managers:", error);
        return NextResponse.json(
            { error: "Failed to fetch managers" },
            { status: 500 }
        );
    }
}
