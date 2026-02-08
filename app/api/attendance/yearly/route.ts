import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getAuthorizedEmployeeIds } from "@/lib/access-control";
import { Prisma } from "@prisma/client";

// Type for month-wise data stored in JSON
interface MonthWiseData {
    month: number;
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
    hours: number;
}

// GET yearly attendance records from pre-aggregated data
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const employeeId = searchParams.get("employeeId");

        // Get current user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            include: { employee: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only admins and managers can view yearly stats
        if (user.role === "EMPLOYEE") {
            // Employees can only view their own yearly stats
            if (!employeeId || (user.employee && employeeId !== user.employee.id)) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }
        }

        // Get authorized employee IDs based on role
        let authorizedIds: string[];
        try {
            authorizedIds = await getAuthorizedEmployeeIds(user as any, employeeId || undefined);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        // Fetch yearly attendance records from pre-aggregated table
        const yearlyRecords = await prisma.yearlyAttendance.findMany({
            where: {
                employeeId: { in: authorizedIds },
                year,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        employeeCode: true,
                        department: true,
                    },
                },
            },
        });

        // If no records found, return empty chart data
        if (yearlyRecords.length === 0) {
            return NextResponse.json({
                chartData: [],
                yearlyRecords: [],
                totalEmployees: 0,
                year,
            });
        }

        // Format for chart (for admin dashboard)
        const chartData = Array.from({ length: 12 }, (_, i) => {
            const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i];

            // Aggregate data from all employees for this month
            let totalPresent = 0;
            let totalLeave = 0;
            let employeeCount = 0;

            yearlyRecords.forEach((record: any) => {
                // Parse monthWiseData as JsonValue and type-check
                const monthWiseData = record.monthWiseData as Prisma.JsonArray;
                if (Array.isArray(monthWiseData)) {
                    const monthData = monthWiseData.find((m: any) => m && typeof m === 'object' && m.month === i + 1) as MonthWiseData | undefined;
                    if (monthData) {
                        totalPresent += monthData.present || 0;
                        totalLeave += monthData.leave || 0;
                        employeeCount++;
                    }
                }
            });

            // Calculate percentages if we have data
            const workingDaysPerMonth = 22;
            const totalPossibleDays = yearlyRecords.length * workingDaysPerMonth;

            const attendancePercent = totalPossibleDays > 0
                ? Math.round((totalPresent / totalPossibleDays) * 100)
                : 0;

            const leavesPercent = totalPossibleDays > 0
                ? Math.round((totalLeave / totalPossibleDays) * 100)
                : 0;

            return {
                month,
                attendance: attendancePercent,
                leaves: leavesPercent,
            };
        });

        return NextResponse.json({
            chartData,
            yearlyRecords,
            totalEmployees: yearlyRecords.length,
            year,
        });
    } catch (error) {
        console.error("Error fetching yearly attendance:", error);
        return NextResponse.json(
            { error: "Failed to fetch yearly attendance" },
            { status: 500 }
        );
    }
}
