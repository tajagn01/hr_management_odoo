import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function markTodayAttendance() {
    console.log("📅 Marking attendance for TODAY (Jan 25, 2026)...");

    try {
        // Hardcode today to match user context if needed, or use new Date()
        // User said "25 January 2026", let's be precise.
        const today = new Date("2026-01-25T09:00:00.000Z"); // UTC or local doesn't matter much as long as date part aligns
        const dateOnly = new Date("2026-01-25T00:00:00.000Z");

        // 1. Get all employees
        const employees = await prisma.employee.findMany({
            include: { user: true }
        });

        console.log(`👥 Found ${employees.length} employees.`);

        let count = 0;

        for (const emp of employees) {
            // Check if attendance already exists
            const existing = await prisma.attendance.findFirst({
                where: {
                    employeeId: emp.id,
                    date: {
                        gte: new Date("2026-01-25T00:00:00.000Z"),
                        lt: new Date("2026-01-26T00:00:00.000Z")
                    }
                }
            });

            if (existing) {
                console.log(`   - ${emp.fullName}: Already has attendance (${existing.status})`);
                continue;
            }

            // Create 'PRESENT' record
            // Randomize check-in slightly
            const checkIn = new Date("2026-01-25T09:00:00.000Z");
            checkIn.setUTCMinutes(Math.floor(Math.random() * 30)); // 9:00 - 9:30 UTC

            // Randomize check-out
            const checkOut = new Date("2026-01-25T17:00:00.000Z");
            checkOut.setUTCMinutes(Math.floor(Math.random() * 60)); // 17:00 - 18:00 UTC

            // 14% chance of being absent or leave (to match seed distribution)
            const rand = Math.random();
            let status = "PRESENT";
            let cIn = checkIn;
            let cOut = checkOut;

            if (rand > 0.9) {
                status = "ABSENT";
                cIn = null as any;
                cOut = null as any;
            } else if (rand > 0.8) {
                status = "LEAVE";
                cIn = null as any;
                cOut = null as any;
            }

            await prisma.attendance.create({
                data: {
                    employeeId: emp.id,
                    date: dateOnly,
                    status: status as any,
                    checkIn: cIn,
                    checkOut: cOut
                }
            });

            console.log(`   - ${emp.fullName}: Marked ${status}`);
            count++;
        }

        console.log(`✅ Successfully marked attendance for ${count} employees.`);

    } catch (error: any) {
        console.error("❌ Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

markTodayAttendance();
