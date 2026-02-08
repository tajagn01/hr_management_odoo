import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getAuthorizedEmployeeIds } from "@/lib/access-control";

// GET monthly attendance records
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

        // Get current user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            include: { employee: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get authorized employee IDs based on role
        let authorizedIds: string[];
        try {
            authorizedIds = await getAuthorizedEmployeeIds(user as any, employeeId || undefined);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        // Build where clause
        const where: any = {
            employeeId: { in: authorizedIds },
            year,
        };

        if (month) {
            where.month = month;
        }

        // Fetch monthly attendance records
        const monthlyRecords = await prisma.monthlyAttendance.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeCode: true,
                        department: true,
                        designation: true,
                    },
                },
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });

        return NextResponse.json({
            monthlyRecords,
            count: monthlyRecords.length,
        });
    } catch (error) {
        console.error("Error fetching monthly attendance:", error);
        return NextResponse.json(
            { error: "Failed to fetch monthly attendance" },
            { status: 500 }
        );
    }
}
