import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed attendance data for February 2026 (Feb 1-5)
 * Excludes Sundays, uses IST timezone (UTC+5:30)
 */
async function seedFebruaryAttendance() {
    console.log("📅 Seeding February 2026 attendance data...\n");

    try {
        // Get all employees
        const employees = await prisma.employee.findMany({
            include: { user: true }
        });

        console.log(`👥 Found ${employees.length} employees\n`);

        // February 2026: Feb 1 is Saturday, Feb 2 is Sunday
        // We'll seed Feb 1 (Sat), Feb 3-5 (Mon-Wed)
        const datesInFebruary = [
            { date: 1, day: "Sat" },  // Feb 1
            // Skip Feb 2 (Sunday)
            { date: 3, day: "Mon" },  // Feb 3
            { date: 4, day: "Tue" },  // Feb 4
            { date: 5, day: "Wed" },  // Feb 5
        ];

        let totalRecords = 0;

        for (const { date, day } of datesInFebruary) {
            // Create UTC date for this day (using Feb 2026)
            const dayStart = new Date(Date.UTC(2026, 1, date, 0, 0, 0, 0)); // Month 1 = February

            console.log(`\n📆 Marking attendance for Feb ${date}, 2026 (${day})...`);

            let dayPresent = 0, dayLate = 0, dayAbsent = 0;

            for (const employee of employees) {
                // Check if attendance already exists
                const existing = await prisma.attendance.findFirst({
                    where: {
                        employeeId: employee.id,
                        date: dayStart
                    }
                });

                if (existing) {
                    console.log(`   ⏭️  ${employee.fullName}: Already has attendance`);
                    continue;
                }

                // Random distribution: 70% present, 20% absent, 10% late
                const rand = Math.random();
                let status: 'PRESENT' | 'ABSENT' | 'LATE';
                let checkIn: Date | null = null;
                let checkOut: Date | null = null;
                let workingHours: number | null = null;

                if (rand <= 0.70) {
                    // 70% - PRESENT (check-in 9:00-9:30 AM IST)
                    status = 'PRESENT';
                    // 9:00 AM IST = 3:30 AM UTC
                    checkIn = new Date(dayStart);
                    checkIn.setUTCHours(3, 30 + Math.floor(Math.random() * 30), 0, 0);

                    // 5:00-6:00 PM IST = 11:30 AM - 12:30 PM UTC
                    checkOut = new Date(dayStart);
                    checkOut.setUTCHours(11, 30 + Math.floor(Math.random() * 60), 0, 0);

                    workingHours = 8.0;
                    dayPresent++;
                } else if (rand <= 0.90) {
                    // 20% - ABSENT
                    status = 'ABSENT';
                    checkIn = null;
                    checkOut = null;
                    workingHours = 0;
                    dayAbsent++;
                } else {
                    // 10% - LATE (9:45-10:15 AM IST)
                    status = 'LATE';
                    // 9:45 AM IST = 4:15 AM UTC
                    checkIn = new Date(dayStart);
                    checkIn.setUTCHours(4, 15 + Math.floor(Math.random() * 30), 0, 0);

                    checkOut = new Date(dayStart);
                    checkOut.setUTCHours(11, 30 + Math.floor(Math.random() * 60), 0, 0);

                    workingHours = 7.5;
                    dayLate++;
                }

                await prisma.attendance.upsert({
                    where: {
                        employeeId_date: {
                            employeeId: employee.id,
                            date: dayStart
                        }
                    },
                    update: {}, // Don't update if exists
                    create: {
                        employeeId: employee.id,
                        date: dayStart,
                        status: status,
                        checkIn: checkIn,
                        checkOut: checkOut,
                        workingHours: workingHours,
                        autoMarked: true
                    }
                });

                totalRecords++;
            }

            console.log(`   ✅ Present: ${dayPresent} | ⏰ Late: ${dayLate} | ❌ Absent: ${dayAbsent}`);
        }

        console.log(`\n✅ Successfully created ${totalRecords} attendance records for February 2026!`);

        // Show summary
        console.log("\n📊 Summary by Date:");
        for (const { date, day } of datesInFebruary) {
            const dayStart = new Date(Date.UTC(2026, 1, date, 0, 0, 0, 0));
            const dayEnd = new Date(Date.UTC(2026, 1, date, 23, 59, 59, 999));

            const records = await prisma.attendance.findMany({
                where: {
                    date: {
                        gte: dayStart,
                        lte: dayEnd
                    }
                }
            });

            const present = records.filter(r => r.status === 'PRESENT').length;
            const late = records.filter(r => r.status === 'LATE').length;
            const absent = records.filter(r => r.status === 'ABSENT').length;

            console.log(`   Feb ${date} (${day}): Total ${records.length} | ✅ ${present} | ⏰ ${late} | ❌ ${absent}`);
        }

    } catch (error: any) {
        console.error("❌ Error:", error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedFebruaryAttendance();
