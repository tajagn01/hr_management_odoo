import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Auto-mark attendance script
 * Runs daily at 5 PM to randomly mark attendance for employees
 * Only activates if NO ONE has made attendance during the day
 * After auto-marking, employees cannot manually mark their attendance
 * Skips Sundays (holidays) and employees on leave
 * Marks attendance from February 2026 onwards
 */
async function autoMarkAttendance() {
    const now = new Date();

    // Skip if it's Sunday (day 0)
    if (now.getDay() === 0) {
        console.log("🚫 Skipping attendance marking - Sunday is a holiday");
        return;
    }

    // Only run from February 2026 onwards
    if (now.getFullYear() < 2026 || (now.getFullYear() === 2026 && now.getMonth() < 1)) {
        console.log("🚫 Skipping attendance marking - before February 2026");
        return;
    }

    console.log(`📅 Auto-marking attendance for ${now.toDateString()}...`);

    try {
        // Get start and end of today (using UTC for consistency across timezones)
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        // First, check if ANYONE has made attendance today
        const anyAttendanceToday = await prisma.attendance.findFirst({
            where: {
                date: {
                    gte: startOfToday,
                    lte: endOfToday
                }
            }
        });

        if (anyAttendanceToday) {
            console.log("🚫 Auto-marking cancelled - Someone has already marked attendance today");
            console.log("   Manual attendance takes precedence over auto-marking");
            return;
        }

        console.log("✅ No attendance records found - proceeding with auto-marking");

        // Get all active employees
        const employees = await prisma.employee.findMany({
            include: {
                user: true
            }
        });

        console.log(`👥 Found ${employees.length} employees to process`);

        let markedCount = 0;
        let skippedCount = 0;

        for (const employee of employees) {
            // Check if employee is on leave for today
            const isOnLeave = await checkIfEmployeeOnLeave(employee.id, startOfToday);

            if (isOnLeave) {
                console.log(`   🏖️ ${employee.fullName}: On leave today`);
                skippedCount++;
                continue;
            }

            // Random attendance generation (70% present, 20% absent, 10% late)
            const randomValue = Math.random();
            let status: 'PRESENT' | 'ABSENT' | 'LATE';
            let checkIn: Date | null = null;
            let checkOut: Date | null = null;
            let workingHours: number | null = null;

            if (randomValue <= 0.70) {
                // 70% chance - PRESENT
                status = 'PRESENT';
                // 9:00 AM IST = 3:30 AM UTC (IST is UTC+5:30)
                checkIn = new Date(startOfToday);
                checkIn.setUTCHours(3, 30 + Math.floor(Math.random() * 30), 0, 0); // 9:00-9:30 AM IST

                checkOut = new Date(startOfToday);
                checkOut.setUTCHours(11, 30 + Math.floor(Math.random() * 60), 0, 0); // 5:00-6:00 PM IST

                workingHours = 8.0;
            } else if (randomValue <= 0.90) {
                // 20% chance - ABSENT (no check-in/out)
                status = 'ABSENT';
                checkIn = null;
                checkOut = null;
                workingHours = 0;
            } else {
                // 10% chance - LATE
                status = 'LATE';
                // Late arrivals: 9:45-10:15 AM IST = 4:15-4:45 AM UTC
                checkIn = new Date(startOfToday);
                checkIn.setUTCHours(4, 15 + Math.floor(Math.random() * 30), 0, 0); // 9:45-10:15 AM IST (late)

                checkOut = new Date(startOfToday);
                checkOut.setUTCHours(11, 30 + Math.floor(Math.random() * 60), 0, 0); // 5:00-6:00 PM IST

                workingHours = 7.5; // Slightly less hours due to late arrival
            }

            await prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    date: startOfToday,
                    status: status,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    workingHours: workingHours,
                    autoMarked: true // Flag to indicate this was auto-marked
                }
            });

            console.log(`   🤖 ${employee.fullName}: Auto-marked as ${status}`);
            markedCount++;
        }

        // After auto-marking, create a flag to prevent manual attendance for today
        await prisma.attendanceConfig.upsert({
            where: {
                date: startOfToday
            },
            update: {
                autoMarkedToday: true,
                lockManualEntry: true
            },
            create: {
                date: startOfToday,
                autoMarkedToday: true,
                lockManualEntry: true
            }
        });

        console.log(`✅ Auto-attendance marking completed:`);
        console.log(`   - Marked: ${markedCount} employees`);
        console.log(`   - Skipped: ${skippedCount} employees`);
        console.log(`   🔒 Manual attendance entry locked for today`);

    } catch (error) {
        console.error('❌ Error in auto-mark attendance:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Check if an employee is on leave for a specific date
 * You'll need to implement this based on your leave management system
 */
async function checkIfEmployeeOnLeave(employeeId: string, date: Date): Promise<boolean> {
    // TODO: Implement leave checking logic
    // For now, return false (no one is on leave)
    // You might have a Leave model or check attendance status for LEAVE

    // Example implementation:
    // const leaveRecord = await prisma.leave.findFirst({
    //     where: {
    //         employeeId: employeeId,
    //         startDate: { lte: date },
    //         endDate: { gte: date },
    //         status: 'APPROVED'
    //     }
    // });
    // return !!leaveRecord;

    return false;
}

/**
 * Schedule this function to run daily at 5 PM
 * You can use cron job or task scheduler:
 * 
 * Cron job: 0 17 * * 1-6 (Mon-Sat at 5 PM)
 * Command: cd /path/to/project && npx tsx scripts/auto-mark-attendance.ts
 */

// Run the script if called directly
if (require.main === module) {
    autoMarkAttendance()
        .then(() => {
            console.log('🎉 Auto-mark attendance script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Auto-mark attendance script failed:', error);
            process.exit(1);
        });
}

export { autoMarkAttendance };