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
        // Get start and end of today using Indian Standard Time (IST = UTC+5:30)
        // This ensures consistency with the scheduler which runs at 5 PM IST
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
        
        const startOfToday = new Date(Date.UTC(
            istTime.getUTCFullYear(),
            istTime.getUTCMonth(),
            istTime.getUTCDate(),
            0, 0, 0, 0
        ));
        const endOfToday = new Date(Date.UTC(
            istTime.getUTCFullYear(),
            istTime.getUTCMonth(),
            istTime.getUTCDate(),
            23, 59, 59, 999
        ));

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

        // Get all active employees (exclude managers - they don't have attendance)
        const employees = await prisma.employee.findMany({
            where: {
                user: {
                    role: "EMPLOYEE"
                }
            },
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

            await prisma.attendance.upsert({
                where: {
                    employeeId_date: {
                        employeeId: employee.id,
                        date: startOfToday
                    }
                },
                update: {}, // Don't update if already exists (manual entry takes precedence)
                create: {
                    employeeId: employee.id,
                    date: startOfToday,
                    status: status,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    workingHours: workingHours,
                    autoMarked: true
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
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const leaveRecord = await prisma.leaveRequest.findFirst({
        where: {
            employeeId: employeeId,
            status: 'APPROVED',
            startDate: { lte: endOfDay },
            endDate: { gte: date }
        }
    });
    return !!leaveRecord;
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