import { prisma } from '@/lib/prisma';

export enum AttendanceState {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LEAVE = 'LEAVE',
    HALF_DAY = 'HALF_DAY'
}

interface CompanyConfig {
    officeStartTime: string;
    gracePeriodMinutes: number;
    workingDays: number[];
    minimumHoursForFullDay: number;
    minimumHoursForHalfDay: number;
}

// Cache config to avoid repeated DB calls (1 minute cache)
let cachedConfig: CompanyConfig | null = null;
let lastConfigFetch = 0;

export async function getCompanyConfig(): Promise<CompanyConfig> {
    const now = Date.now();
    if (cachedConfig && (now - lastConfigFetch < 60000)) {
        return cachedConfig;
    }

    // Return default configuration
    cachedConfig = {
        officeStartTime: '09:00',
        gracePeriodMinutes: 15,
        workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat (0=Sunday, 6=Saturday)
        minimumHoursForFullDay: 8.0,
        minimumHoursForHalfDay: 4.0
    };

    lastConfigFetch = now;
    return cachedConfig;
}

export async function calculateAttendanceStatus(
    employeeId: string,
    date: Date
): Promise<AttendanceState> {
    const config = await getCompanyConfig();
    // Use UTC to ensure consistency across timezones (localhost vs deployment)
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

    // 1. Check if Sunday (no attendance needed)
    const dayOfWeek = date.getDay(); // 0 = Sunday
    if (dayOfWeek === 0) {
        return AttendanceState.ABSENT; // Sundays are holidays, no attendance expected
    }

    // 2. Check if ON_LEAVE (approved leave exists)
    // We check for any approved leave that covers this date
    const approvedLeave = await prisma.leaveRequest.findFirst({
        where: {
            employeeId,
            status: 'APPROVED',
            startDate: { lte: dayEnd },
            endDate: { gte: dayStart }
        }
    });

    if (approvedLeave) {
        return AttendanceState.LEAVE;
    }

    // 3. Check attendance record
    // Logic: Need to find attendance by employeeId and date range
    const attendance = await prisma.attendance.findFirst({
        where: {
            employeeId,
            date: {
                gte: dayStart,
                lte: dayEnd
            }
        }
    });

    // No check-in = ABSENT (since it's not a holiday or leave)
    if (!attendance || !attendance.checkIn) {
        return AttendanceState.ABSENT;
    }

    // 4. Check for HALF_DAY logic (applied on checkout or end of day)
    if (attendance.checkOut && attendance.workingHours) {
        if (attendance.workingHours < config.minimumHoursForFullDay &&
            attendance.workingHours >= config.minimumHoursForHalfDay) {
            return AttendanceState.HALF_DAY;
        }
        // Note: If less than half day hours, it might be considered ABSENT or SHORT_LEAVE depending on policy,
        // but typically we might just leave it as PRESENT/LATE or define another rule. 
        // For now, if hours are very low, we could return PRESENT (checked in) or handle strictly.
        // Keeping it simple: If checked in and not late, it's PRESENT unless hours downgrade it to HALF_DAY.
    }

    return AttendanceState.PRESENT;
}

export async function getBulkAttendanceStatus(
    date: Date,
    employeeIds: string[]
): Promise<{ employeeId: string; status: AttendanceState }[]> {
    if (employeeIds.length === 0) return [];

    const config = await getCompanyConfig();
    // Use UTC to ensure consistency across timezones (localhost vs deployment)
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

    // 1. Check if Sunday (O(1) query)
    const dayOfWeek = date.getDay();
    let isSunday = dayOfWeek === 0;

    // 2. Fetch ALL Attendance Records (O(1) query)
    const attendanceRecords = await prisma.attendance.findMany({
        where: {
            employeeId: { in: employeeIds },
            date: { gte: dayStart, lte: dayEnd }
        }
    });

    const attendanceMap = new Map();
    attendanceRecords.forEach(r => attendanceMap.set(r.employeeId, r));

    // 3. Fetch ALL Approved Leaves for this day (O(1) query)
    const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
            employeeId: { in: employeeIds },
            status: 'APPROVED',
            startDate: { lte: dayEnd },
            endDate: { gte: dayStart }
        }
    });

    const leaveMap = new Set();
    approvedLeaves.forEach(l => leaveMap.add(l.employeeId));

    // 4. In-Memory Calculation (O(N) but extremely fast)
    return employeeIds.map(employeeId => {
        // A. Check Sunday
        if (isSunday) return { employeeId, status: AttendanceState.ABSENT };

        // B. Check Leave
        if (leaveMap.has(employeeId)) return { employeeId, status: AttendanceState.LEAVE };

        // C. Check Record
        const record = attendanceMap.get(employeeId);
        if (!record || !record.checkIn) return { employeeId, status: AttendanceState.ABSENT };

        // D. Check Half Day
        if (record.checkOut && record.workingHours) {
            if (record.workingHours < config.minimumHoursForFullDay &&
                record.workingHours >= config.minimumHoursForHalfDay) {
                return { employeeId, status: AttendanceState.HALF_DAY };
            }
        }

        return { employeeId, status: AttendanceState.PRESENT };
    });
}
