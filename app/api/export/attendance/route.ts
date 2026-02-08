import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { createAuditLog, AuditAction, getClientIP, getUserAgent } from "@/lib/audit-logger";

/**
 * GET /api/export/attendance
 * Export attendance data as CSV or JSON
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !["ADMIN", "MANAGER"].includes((session.user as any).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get("format") || "json";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const employeeId = searchParams.get("employeeId");

        // Build where clause
        const where: any = {};

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        if (employeeId) {
            where.employeeId = employeeId;
        }

        // Fetch attendance records
        const attendance = await prisma.attendance.findMany({
            where,
            include: {
                employee: {
                    select: {
                        fullName: true,
                        employeeCode: true,
                        department: true,
                    },
                },
            },
            orderBy: { date: "desc" },
        });

        // Audit log
        await createAuditLog({
            action: AuditAction.DATA_EXPORT,
            userId: (session.user as any).id,
            userEmail: session.user.email!,
            metadata: {
                exportType: "ATTENDANCE",
                format,
                count: attendance.length,
                dateRange: startDate && endDate ? { startDate, endDate } : null,
            },
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request),
        });

        if (format === "csv") {
            // Generate CSV
            const csvRows = [];

            // Header
            csvRows.push([
                "Date",
                "Employee Code",
                "Employee Name",
                "Department",
                "Check In",
                "Check Out",
                "Working Hours",
                "Status",
            ].join(","));

            // Data rows
            for (const record of attendance) {
                csvRows.push([
                    record.date.toISOString().split("T")[0],
                    record.employee.employeeCode,
                    `"${record.employee.fullName}"`,
                    record.employee.department,
                    record.checkIn?.toISOString() || "",
                    record.checkOut?.toISOString() || "",
                    record.workingHours?.toString() || "0",
                    record.status,
                ].join(","));
            }

            const csv = csvRows.join("\n");

            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="attendance_${new Date().toISOString().split("T")[0]}.csv"`,
                },
            });
        }

        // Return JSON
        return NextResponse.json({
            attendance,
            exportedAt: new Date().toISOString(),
            count: attendance.length,
        });
    } catch (error) {
        logger.error("Error exporting attendance", error);
        return NextResponse.json(
            { error: "Failed to export attendance" },
            { status: 500 }
        );
    }
}
