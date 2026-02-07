import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateMonthlyAttendance } from '@/lib/attendance-aggregator';

/**
 * Auto-checkout API endpoint
 * Automatically checks out employees who forgot to checkout at 5:15 PM IST
 *
 * Called by: Vercel Cron, GitHub Actions, or external cron service
 * Schedule: Daily at 5:15 PM IST (11:45 AM UTC)
 *
 * Security: Protected by CRON_SECRET
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

        // Use IST (UTC+5:30)
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + IST_OFFSET_MS);
        const startOfToday = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0));
        const endOfToday = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 23, 59, 59, 999));

        // Skip if it's Sunday
        if (istNow.getUTCDay() === 0) {
            return NextResponse.json({
                message: 'Skipped - Sunday is a holiday',
                skipped: true
            });
        }

        // Find all attendance records for today where employee checked in but NOT checked out
        const missingCheckouts = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startOfToday,
                    lte: endOfToday,
                },
                checkIn: { not: null },
                checkOut: null,
                status: { in: ['PRESENT', 'LATE'] },
            },
            include: {
                employee: {
                    select: { id: true, fullName: true },
                },
            },
        });

        if (missingCheckouts.length === 0) {
            return NextResponse.json({
                message: 'No missing checkouts found for today',
                autoCheckedOut: 0,
            });
        }

        // Auto-checkout time: 5:15 PM IST = 11:45 AM UTC
        const autoCheckoutTime = new Date(startOfToday);
        autoCheckoutTime.setUTCHours(11, 45, 0, 0); // 5:15 PM IST

        const results: any[] = [];

        for (const record of missingCheckouts) {
            const checkInTime = new Date(record.checkIn!);
            const workingHours = (autoCheckoutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

            // Determine status based on working hours
            let status = record.status;
            if (workingHours < 4) {
                status = 'ABSENT' as any;
            } else if (workingHours < 8) {
                status = 'HALF_DAY' as any;
            }

            await prisma.attendance.update({
                where: { id: record.id },
                data: {
                    checkOut: autoCheckoutTime,
                    workingHours: Math.round(workingHours * 100) / 100,
                    // @ts-ignore
                    status,
                },
            });

            // Update monthly attendance aggregation
            try {
                await updateMonthlyAttendance(record.employeeId, startOfToday);
            } catch (err) {
                console.error(`Failed to update monthly attendance for ${record.employee.fullName}:`, err);
            }

            results.push({
                employee: record.employee.fullName,
                employeeId: record.employeeId,
                checkIn: record.checkIn,
                autoCheckOut: autoCheckoutTime,
                workingHours: Math.round(workingHours * 100) / 100,
                status,
            });
        }

        return NextResponse.json({
            message: `Auto-checkout completed for ${results.length} employee(s)`,
            date: startOfToday.toISOString(),
            autoCheckedOut: results.length,
            checkoutTime: '5:15 PM IST',
            results,
        });
    } catch (error) {
        console.error('Error in auto-checkout:', error);
        return NextResponse.json(
            { error: 'Failed to auto-checkout' },
            { status: 500 }
        );
    }
}
