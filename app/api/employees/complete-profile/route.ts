import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/data";
import { logger } from "@/lib/logger";

export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();
        logger.debug("Complete profile request", { userId });
        const { fullName, dateOfBirth, phone, address, joiningDate, department, designation, managerId } = body;

        // Validate required fields
        if (!fullName || !dateOfBirth || !phone || !address || !joiningDate || !department || !designation) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Check if employee profile exists
        let employee = await prisma.employee.findUnique({
            where: { userId }
        });

        if (employee) {
            // Update existing employee profile
            employee = await prisma.employee.update({
                where: { id: employee.id },
                data: {
                    fullName,
                    dateOfBirth: new Date(dateOfBirth),
                    phone,
                    address,
                    joiningDate: new Date(joiningDate),
                    department,
                    designation,
                    managerId: managerId || null,
                    profileCompleted: true
                }
            });
        } else {
            // Create new employee profile (for Google login users)
            const lastEmployee = await prisma.employee.findFirst({
                orderBy: { employeeCode: 'desc' }
            });

            // Generate next employee code
            const lastCode = lastEmployee?.employeeCode || 'EMP000';
            const lastNumber = parseInt(lastCode.replace('EMP', ''));
            const newCode = `EMP${String(lastNumber + 1).padStart(3, '0')}`;

            employee = await prisma.employee.create({
                data: {
                    userId,
                    employeeCode: newCode,
                    fullName,
                    dateOfBirth: new Date(dateOfBirth),
                    phone,
                    address,
                    joiningDate: new Date(joiningDate),
                    department,
                    designation,
                    managerId: managerId || null,
                    profileCompleted: true
                }
            });

            logger.info("Created employee profile for Google user", { userId, employeeCode: newCode });
        }

        // Invalidate cache
        revalidateTag(TAGS.employees, "max");

        return NextResponse.json({
            success: true,
            employee,
            employeeId: employee.id
        });
    } catch (error) {
        logger.error("Error completing profile", error);
        return NextResponse.json(
            { error: "Failed to complete profile" },
            { status: 500 }
        );
    }
}
