import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { createAuditLog, AuditAction, getClientIP, getUserAgent } from "@/lib/audit-logger";

/**
 * GET /api/export/employees
 * Export employees data as CSV or JSON
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || !["ADMIN", "MANAGER"].includes((session.user as any).role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get("format") || "json"; // json or csv
        const includePayroll = searchParams.get("includePayroll") === "true";

        // Fetch employees
        const employees = await prisma.employee.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        role: true,
                    },
                },
                manager: {
                    select: {
                        fullName: true,
                    },
                },
                payroll: includePayroll,
            },
            orderBy: { createdAt: "desc" },
        });

        // Audit log
        await createAuditLog({
            action: AuditAction.DATA_EXPORT,
            userId: (session.user as any).id,
            userEmail: session.user.email!,
            metadata: {
                exportType: "EMPLOYEES",
                format,
                count: employees.length,
                includePayroll,
            },
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request),
        });

        if (format === "csv") {
            // Generate CSV
            const csvRows = [];

            // Header
            const headers = [
                "Employee Code",
                "Full Name",
                "Email",
                "Phone",
                "Department",
                "Designation",
                "Joining Date",
                "Date of Birth",
                "Role",
                "Manager",
            ];

            if (includePayroll) {
                headers.push("Basic Salary", "HRA", "Allowances", "Deductions", "Net Salary");
            }

            csvRows.push(headers.join(","));

            // Data rows
            for (const emp of employees) {
                const row = [
                    emp.employeeCode,
                    `"${emp.fullName}"`,
                    emp.user?.email || "",
                    emp.phone || "",
                    emp.department,
                    emp.designation,
                    emp.joiningDate.toISOString().split("T")[0],
                    emp.dateOfBirth?.toISOString().split("T")[0] || "",
                    emp.user?.role || "",
                    emp.manager?.fullName || "",
                ];

                if (includePayroll && emp.payroll) {
                    row.push(
                        emp.payroll.basicSalary.toString(),
                        emp.payroll.hra.toString(),
                        emp.payroll.allowances.toString(),
                        emp.payroll.deductions.toString(),
                        emp.payroll.netSalary.toString()
                    );
                }

                csvRows.push(row.join(","));
            }

            const csv = csvRows.join("\n");

            return new NextResponse(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="employees_${new Date().toISOString().split("T")[0]}.csv"`,
                },
            });
        }

        // Return JSON
        return NextResponse.json({
            employees,
            exportedAt: new Date().toISOString(),
            count: employees.length,
        });
    } catch (error) {
        logger.error("Error exporting employees", error);
        return NextResponse.json(
            { error: "Failed to export employees" },
            { status: 500 }
        );
    }
}
