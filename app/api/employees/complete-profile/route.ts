import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/data";
import { logger } from "@/lib/logger";

export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!(session?.user as any)?.employeeId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        logger.debug("Complete profile request", { employeeId: (session?.user as any)?.employeeId });
        const { fullName, dateOfBirth, phone, address, joiningDate, department, designation, managerId } = body;

        // Validate required fields
        if (!fullName || !dateOfBirth || !phone || !address || !joiningDate || !department || !designation) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Update employee profile
        const updatedEmployee = await prisma.employee.update({
            where: { id: (session?.user as any)?.employeeId },
            data: {
                fullName,
                dateOfBirth: new Date(dateOfBirth),
                phone,
                address,
                joiningDate: new Date(joiningDate),
                department,
                designation,
                managerId: managerId || undefined,
                profileCompleted: true
            }
        });

        // Invalidate cache
        revalidateTag(TAGS.employees, "max");

        return NextResponse.json({
            success: true,
            employee: updatedEmployee
        });
    } catch (error) {
        logger.error("Error completing profile", error);
        return NextResponse.json(
            { error: "Failed to complete profile" },
            { status: 500 }
        );
    }
}
