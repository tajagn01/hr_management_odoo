import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { createAuditLog, AuditAction, getClientIP, getUserAgent } from "@/lib/audit-logger";
import bcrypt from "bcryptjs";

// Bulk employee import schema
const bulkEmployeeSchema = z.object({
    employees: z.array(z.object({
        email: z.string().email(),
        fullName: z.string().min(2),
        phone: z.string().optional(),
        department: z.string(),
        designation: z.string(),
        joiningDate: z.string().datetime(),
        salary: z.number().min(0).optional(),
        role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
    })),
});

// Bulk update schema
const bulkUpdateSchema = z.object({
    employeeIds: z.array(z.string().uuid()),
    updates: z.object({
        department: z.string().optional(),
        designation: z.string().optional(),
        salary: z.number().min(0).optional(),
    }),
});

/**
 * POST /api/bulk/employees
 * Bulk import employees
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { employees } = bulkEmployeeSchema.parse(body);

        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ email: string; error: string }>,
        };

        // Process each employee
        for (const emp of employees) {
            try {
                // Check if user already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email: emp.email },
                });

                if (existingUser) {
                    results.failed++;
                    results.errors.push({
                        email: emp.email,
                        error: "User already exists",
                    });
                    continue;
                }

                // Generate random password
                const tempPassword = Math.random().toString(36).slice(-8);
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                // Create user and employee
                await prisma.user.create({
                    data: {
                        email: emp.email,
                        password: hashedPassword,
                        role: emp.role,
                        employee: {
                            create: {
                                fullName: emp.fullName,
                                phone: emp.phone,
                                department: emp.department,
                                designation: emp.designation,
                                joiningDate: new Date(emp.joiningDate),
                                employeeCode: `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`,
                            },
                        },
                    },
                });

                results.success++;

                // TODO: Send welcome email with temp password
                logger.info("Employee created via bulk import", {
                    email: emp.email,
                    tempPassword, // Remove in production
                });
            } catch (error) {
                results.failed++;
                results.errors.push({
                    email: emp.email,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        // Audit log
        await createAuditLog({
            action: AuditAction.BULK_OPERATION,
            userId: (session.user as any).id,
            userEmail: session.user.email!,
            metadata: {
                operation: "BULK_EMPLOYEE_IMPORT",
                totalEmployees: employees.length,
                successCount: results.success,
                failedCount: results.failed,
            },
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request),
        });

        logger.info("Bulk employee import completed", results);

        return NextResponse.json({
            message: "Bulk import completed",
            results,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        logger.error("Error in bulk employee import", error);
        return NextResponse.json(
            { error: "Failed to import employees" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/bulk/employees
 * Bulk update employees
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { employeeIds, updates } = bulkUpdateSchema.parse(body);

        // Update all employees
        const result = await prisma.employee.updateMany({
            where: {
                id: { in: employeeIds },
            },
            data: updates,
        });

        // Audit log
        await createAuditLog({
            action: AuditAction.BULK_OPERATION,
            userId: (session.user as any).id,
            userEmail: session.user.email!,
            metadata: {
                operation: "BULK_EMPLOYEE_UPDATE",
                employeeCount: employeeIds.length,
                updatedCount: result.count,
                updates,
            },
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request),
        });

        logger.info("Bulk employee update completed", {
            employeeIds,
            updates,
            count: result.count,
        });

        return NextResponse.json({
            message: `Updated ${result.count} employees`,
            count: result.count,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        logger.error("Error in bulk employee update", error);
        return NextResponse.json(
            { error: "Failed to update employees" },
            { status: 500 }
        );
    }
}
