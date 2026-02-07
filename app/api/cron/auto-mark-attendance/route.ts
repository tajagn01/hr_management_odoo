import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Auto-mark attendance API endpoint for production
 * This can be called by:
 * 1. Vercel Cron Jobs (vercel.json)
 * 2. GitHub Actions scheduled workflows
 * 3. External cron services (cron-job.org, EasyCron)
 * 
 * Security: Protected by secret token
 */
export async function GET(request: NextRequest) {
    try {
        // Security: Verify the request is from authorized source
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const now = new Date();

        // Skip if it's Sunday (day 0)
        if (now.getDay() === 0) {
            return NextResponse.json({
                message: 'Skipped - Sunday is a holiday',
                skipped: true
            });
        }

        // Only run from February 2026 onwards
        if (now.getFullYear() < 2026 || (now.getFullYear() === 2026 && now.getMonth() < 1)) {
            return NextResponse.json({
                message: 'Skipped - before February 2026',
                skipped: true
            });
        }

        // Use IST (UTC+5:30) to match dashboard display timezone
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + IST_OFFSET_MS);
        const startOfToday = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
        const endOfToday = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 23, 59, 59, 999));

        // Check if ANYONE has marked attendance today
        const anyAttendanceToday = await prisma.attendance.findFirst({
            where: {
                date: {
                    gte: startOfToday,
                    lte: endOfToday
                }
            }
        });

        if (anyAttendanceToday) {
            return NextResponse.json({
                message: 'Auto-marking cancelled - Manual attendance exists',
                skipped: true,
                reason: 'Manual attendance takes precedence'
            });
        }

        // Get all active employees
        const employees = await prisma.employee.findMany({
            include: { user: true }
        });

        let markedCount = 0;
        let skippedCount = 0;
        const results: any[] = [];

        for (const employee of employees) {
            // Check if employee is on leave
            const isOnLeave = await prisma.leaveRequest.findFirst({
                where: {
                    employeeId: employee.id,
                    status: 'APPROVED',
                    startDate: { lte: endOfToday },
                    endDate: { gte: startOfToday }
                }
            });

            if (isOnLeave) {
                skippedCount++;
                results.push({
                    employee: employee.fullName,
                    status: 'SKIPPED',
                    reason: 'On leave'
                });
                continue;
            }

            // Random attendance generation
            const randomValue = Math.random();
            let status: 'PRESENT' | 'ABSENT' | 'LATE';
            let checkIn: Date | null = null;
            let checkOut: Date | null = null;
            let workingHours: number | null = null;

            if (randomValue <= 0.70) {
                // 70% PRESENT - 9:00 AM IST = 3:30 AM UTC
                status = 'PRESENT';
                checkIn = new Date(startOfToday);
                checkIn.setUTCHours(3, 30 + Math.floor(Math.random() * 30), 0, 0); // 9:00-9:30 AM IST

                checkOut = new Date(startOfToday);
                checkOut.setUTCHours(11, 30 + Math.floor(Math.random() * 60), 0, 0); // 5:00-6:00 PM IST

                workingHours = 8.0;
            } else if (randomValue <= 0.90) {
                // 20% ABSENT
                status = 'ABSENT';
                checkIn = null;
                checkOut = null;
                workingHours = 0;
            } else {
                // 10% LATE - 9:45 AM IST = 4:15 AM UTC
                status = 'LATE';
                checkIn = new Date(startOfToday);
                checkIn.setUTCHours(4, 15 + Math.floor(Math.random() * 30), 0, 0); // 9:45-10:15 AM IST

                checkOut = new Date(startOfToday);
                checkOut.setUTCHours(11, 30 + Math.floor(Math.random() * 60), 0, 0); // 5:00-6:00 PM IST

                workingHours = 7.5;
            }

            await prisma.attendance.upsert({
                where: {
                    employeeId_date: {
                        employeeId: employee.id,
                        date: startOfToday
                    }
                },
                update: {}, // Don't update if exists
                create: {
                    employeeId: employee.id,
                    date: startOfToday,
                    // @ts-ignore
                    status: status,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    // @ts-ignore
                    workingHours: workingHours,
                    autoMarked: true
                }
            });

            markedCount++;
            results.push({
                employee: employee.fullName,
                status: status,
                autoMarked: true
            });
        }

        // Lock manual entry for today
        await prisma.attendanceConfig.upsert({
            where: { date: startOfToday },
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

        return NextResponse.json({
            message: 'Auto-attendance marking completed',
            date: startOfToday.toDateString(),
            marked: markedCount,
            skipped: skippedCount,
            totalEmployees: employees.length,
            results: results
        });

    } catch (error) {
        console.error('Error in auto-mark attendance:', error);
        return NextResponse.json(
            { error: 'Failed to auto-mark attendance' },
            { status: 500 }
        );
    }
}
