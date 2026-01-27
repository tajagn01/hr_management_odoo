import { NextRequest, NextResponse } from 'next/server';
import { calculateAttendanceStatus, getBulkAttendanceStatus } from '@/lib/attendance-service';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeeIds = searchParams.getAll('employeeIds[]');

        // Fallback if array format isn't parsed automatically or sent as comma-separated
        let targetEmployeeIds = employeeIds;
        if (employeeIds.length === 0 && searchParams.has('employeeIds')) {
            targetEmployeeIds = searchParams.get('employeeIds')!.split(',');
        }

        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        if (!startDateStr || !endDateStr) {
            return NextResponse.json({ error: "Start and end date required" }, { status: 400 });
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const results = [];

        // Performance note: In a real production system with thousands of employees, 
        // we would optimize this to fetch all data in bulk queries rather than loop.
        // For now, the service handles individual logic correctly.

        if (targetEmployeeIds.length > 0) {
            // Optimized approach: Use single batch query service
            if (startDate.toDateString() === endDate.toDateString()) {
                // If single day (common case for dashboard), super fast path
                const statuses = await getBulkAttendanceStatus(startDate, targetEmployeeIds);
                statuses.forEach(s => {
                    results.push({
                        employeeId: s.employeeId,
                        date: startDate.toISOString(),
                        status: s.status
                    });
                });
            } else {
                // Multi-day range (e.g., export) - can still optimize but loop day-by-day batch
                let currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const dayStatuses = await getBulkAttendanceStatus(new Date(currentDate), targetEmployeeIds);
                    dayStatuses.forEach(s => {
                        results.push({
                            employeeId: s.employeeId,
                            date: currentDate.toISOString(), // Use accurate loop date
                            status: s.status
                        });
                    });
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error calculating bulk status:', error);
        return NextResponse.json({ error: 'Failed to calculate statuses' }, { status: 500 });
    }
}
