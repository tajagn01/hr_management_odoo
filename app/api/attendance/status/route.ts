import { NextRequest, NextResponse } from 'next/server';
import { calculateAttendanceStatus } from '@/lib/attendance-service';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const dateStr = searchParams.get('date');

        if (!employeeId || !dateStr) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const date = new Date(dateStr);
        const status = await calculateAttendanceStatus(employeeId, date);

        return NextResponse.json({
            status,
            date: date.toISOString(),
            employeeId
        });
    } catch (error) {
        console.error('Error calculating attendance status:', error);
        return NextResponse.json({ error: 'Failed to calculate status' }, { status: 500 });
    }
}
