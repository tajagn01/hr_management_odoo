import { prisma } from "@/lib/prisma";

export async function generateRandomAttendance() {
    console.log("🎲 Generating Random Attendance for active employees...");

    try {
        const now = new Date();
        // Use IST (UTC+5:30)
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + IST_OFFSET_MS);

        // Start of today in UTC (00:00 IST)
        const startOfToday = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));

        // Get all active employees
        const employees = await prisma.employee.findMany({
            where: {
                user: {
                    isActive: true,
                }
            },
            select: { id: true, fullName: true }
        });

        console.log(`📋 Found ${employees.length} active employees to check.`);

        let markedCount = 0;
        let skippedCount = 0;

        for (const employee of employees) {
            // Check if attendance already exists
            const existingAttendance = await prisma.attendance.findUnique({
                where: {
                    employeeId_date: {
                        employeeId: employee.id,
                        date: startOfToday
                    }
                }
            });

            if (existingAttendance) {
                skippedCount++;
                continue;
            }

            // Check if on leave
            const approvedLeave = await prisma.leaveRequest.findFirst({
                where: {
                    employeeId: employee.id,
                    status: 'APPROVED',
                    startDate: { lte: startOfToday }, // Simplified check
                    endDate: { gte: startOfToday }
                }
            });

            if (approvedLeave) {
                skippedCount++;
                // Optionally mark as LEAVE here if not exists
                continue;
            }

            // Random Generation Logic
            const randomValue = Math.random();
            let status: 'PRESENT' | 'ABSENT' | 'HALF_DAY';
            let checkIn: Date | null = null;
            let checkOut: Date | null = null;
            let workingHours: number | null = null;

            if (randomValue <= 0.85) { // Increased to 85% Present for better demo
                // PRESENT
                status = 'PRESENT';
                checkIn = new Date(startOfToday);
                checkIn.setUTCHours(3, 30 + Math.floor(Math.random() * 45), 0, 0); // 9:00-9:45 AM IST

                // Some might not have checked out yet if it's "today"?
                // For simulation "history", we should populate checkout.
                // For "today", strictly speaking, if run in morning, checkout is null.
                // But user wants "mark attendance", usually implying full records for demo.
                // Let's assume full day records for simplicity OR partial if run early?
                // The original script set checkout. Let's keep it.

                checkOut = new Date(startOfToday);
                checkOut.setUTCHours(11, 30 + Math.floor(Math.random() * 60), 0, 0); // 5:00-6:00 PM IST

                workingHours = 8.0 + Math.random() * 1.5;
            } else if (randomValue <= 0.95) {
                // HALF DAY
                status = 'HALF_DAY';
                checkIn = new Date(startOfToday);
                checkIn.setUTCHours(4, Math.floor(Math.random() * 60), 0, 0); // 9:30-10:30 AM IST

                checkOut = new Date(startOfToday);
                checkOut.setUTCHours(8, Math.floor(Math.random() * 60), 0, 0); // 1:30-2:30 PM IST

                workingHours = 4.0 + Math.random();
            } else {
                // ABSENT
                status = 'ABSENT';
                checkIn = null;
                checkOut = null;
                workingHours = 0;
            }

            // Create Record
            await prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    date: startOfToday,
                    status: status,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    workingHours: workingHours
                }
            });
            markedCount++;
        }

        console.log(`✅ Simulation Complete: Marked ${markedCount}, Skipped ${skippedCount}`);
        return { markedCount, skippedCount };

    } catch (error) {
        console.error("❌ Error generating random attendance:", error);
        throw error;
    }
}
