import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET yearly attendance records for chart
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        // Get user to check permissions
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            include: { employee: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only admins can view yearly stats
        if (user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Get total employees count
        const totalEmployees = await prisma.employee.count();

        if (totalEmployees === 0) {
            return NextResponse.json({
                chartData: [],
                totalEmployees: 0
            });
        }

        // Date range for the entire year
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

        // Fetch ALL attendance records for the year in a SINGLE query
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startOfYear,
                    lte: endOfYear,
                },
            },
            select: {
                date: true,
                status: true,
            },
        });

        // Group by month and calculate stats
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const workingDaysPerMonth = 22;
        const totalPossibleDays = totalEmployees * workingDaysPerMonth;

        const chartData = months.map((month, index) => {
            const monthRecords = attendanceRecords.filter(r => {
                const recordMonth = new Date(r.date).getMonth();
                return recordMonth === index;
            });

            const presentDays = monthRecords.filter(r =>
                r.status === "PRESENT" || r.status === "HALF_DAY"
            ).length;

            const leaveDays = monthRecords.filter(r =>
                r.status === "LEAVE"
            ).length;

            const attendancePercent = totalPossibleDays > 0
                ? Math.round((presentDays / totalPossibleDays) * 100)
                : 0;

            const leavesPercent = totalPossibleDays > 0
                ? Math.round((leaveDays / totalPossibleDays) * 100)
                : 0;

            return {
                month,
                attendance: attendancePercent,
                leaves: leavesPercent,
            };
        });

        return NextResponse.json({
            chartData,
            totalEmployees,
            year
        });
    } catch (error) {
        console.error("Error fetching yearly attendance:", error);
        return NextResponse.json({ error: "Failed to fetch yearly attendance" }, { status: 500 });
    }
}
