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
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key-change-this';

        if (authHeader !== `Bearer ${cronSecret}`) {
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

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(startOfToday);
        endOfToday.setHours(23, 59, 59, 999);

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
                // 70% PRESENT
                status = 'PRESENT';
                checkIn = new Date(startOfToday);
                checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);

                checkOut = new Date(startOfToday);
                checkOut.setHours(17, Math.floor(Math.random() * 60), 0, 0);

                workingHours = 8.0;
            } else if (randomValue <= 0.90) {
                // 20% ABSENT
                status = 'ABSENT';
                checkIn = null;
                checkOut = null;
                workingHours = 0;
            } else {
                // 10% LATE
                status = 'LATE';
                checkIn = new Date(startOfToday);
                checkIn.setHours(9, 45 + Math.floor(Math.random() * 30), 0, 0);

                checkOut = new Date(startOfToday);
                checkOut.setHours(17, Math.floor(Math.random() * 60), 0, 0);

                workingHours = 7.5;
            }

            await prisma.attendance.create({
                data: {
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
