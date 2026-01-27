import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Revalidation Tags
export const TAGS = {
    employees: "employees",
    attendance: "attendance",
    leaves: "leaves",
    payroll: "payroll",
};

// -----------------------------------------------------------------------------
// LOCKED SELECTS (Performance)
// -----------------------------------------------------------------------------

export const employeeSelect = {
    id: true,
    fullName: true,
    employeeCode: true,
    designation: true,
    department: true,
    phone: true,
    address: true,
    joiningDate: true,
    profileImage: true,
    profileCompleted: true,
    managerId: true,
    user: {
        select: {
            email: true,
            role: true,
            isActive: true
        }
    }
};

export const attendanceSelect = {
    id: true,
    date: true,
    status: true,
    checkIn: true,
    checkOut: true,
    workingHours: true
};

export const leaveSelect = {
    id: true,
    type: true,
    startDate: true,
    endDate: true,
    days: true,
    status: true,
    reason: true,
    createdAt: true,
    adminComment: true,
    approvedAt: true
};

export const payrollSelect = {
    id: true,
    basicSalary: true,
    netSalary: true,
    allowances: true,
    deductions: true
};

// -----------------------------------------------------------------------------
// AGGREGATED "BFF" FETCHER (Staff Engineer Level)
// -----------------------------------------------------------------------------

export const getEmployeeOverviewCached = unstable_cache(
    async (employeeId: string) => {
        // Parallel Fetching: The "BFF" Pattern inside the Cache Worker
        const start = performance.now();

        // Calculate date ranges for "Recent Activity" (e.g., last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Normalize dates for index hit
        today.setHours(23, 59, 59, 999);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const [employee, attendance, leaves, payroll] = await Promise.all([
            // 1. Profile
            prisma.employee.findUnique({
                where: { id: employeeId },
                select: employeeSelect
            }),
            // 2. Recent Attendance
            prisma.attendance.findMany({
                where: {
                    employeeId,
                    date: { gte: thirtyDaysAgo, lte: today }
                },
                orderBy: { date: "desc" },
                take: 30, // Limit to recent
                select: attendanceSelect
            }),
            // 3. Recent Leaves
            prisma.leaveRequest.findMany({
                where: { employeeId }, // Index: [employeeId, createdAt]
                orderBy: { createdAt: "desc" },
                take: 5,
                select: leaveSelect
            }),
            // 4. Payroll
            prisma.payroll.findUnique({
                where: { employeeId },
                select: payrollSelect
            })
        ]);

        const duration = performance.now() - start;
        if (duration > 200) {
            console.warn(`⚠️ Slow Aggregated Fetch for ${employeeId}: ${duration.toFixed(2)}ms`);
        }

        // summary calculations
        const attendanceSummary = {
            present: attendance.filter(a => a.status === "PRESENT").length,
            absent: attendance.filter(a => a.status === "ABSENT").length,
            halfDay: attendance.filter(a => a.status === "HALF_DAY").length,
        };

        return {
            profile: employee,
            attendance: attendance,
            leaves: leaves,
            payroll: payroll,
            summary: {
                attendance: attendanceSummary
            }
        };
    },
    ["employee-overview-aggregate-v2"], // Key
    { tags: [TAGS.employees, TAGS.attendance, TAGS.leaves, TAGS.payroll], revalidate: 300 } // Increased from 60s to 5min for better caching
);

// -----------------------------------------------------------------------------
// LEGACY CACHED FETCHERS (Simplified)
// -----------------------------------------------------------------------------

export const getEmployeesCached = unstable_cache(
    async (managerId?: string, includePayroll = false) => {
        const where = managerId ? { managerId } : {};

        const employees = await prisma.employee.findMany({
            where,
            select: {
                ...employeeSelect,
                ...(includePayroll && { payroll: { select: payrollSelect } })
            },
            orderBy: { fullName: "asc" },
        });
        return employees;
    },
    ["employees-list-v3"],
    { tags: [TAGS.employees], revalidate: 1 }
);

export const getEmployeeByIdCached = unstable_cache(
    async (id: string) => {
        return prisma.employee.findUnique({
            where: { id },
            select: {
                ...employeeSelect,
                payroll: { select: payrollSelect }
            }
        });
    },
    ["employee-detail"],
    { tags: [TAGS.employees], revalidate: 3600 }
);

export const getAttendanceCached = unstable_cache(
    async (params: { employeeId?: string; startDate?: Date; endDate?: Date; teamIds?: string[] }) => {
        const { employeeId, startDate, endDate, teamIds } = params;
        const where: any = {};

        if (employeeId) {
            where.employeeId = employeeId;
        } else if (teamIds && teamIds.length > 0) {
            where.employeeId = { in: teamIds };
        }

        if (startDate && endDate) {
            where.date = { gte: startDate, lte: endDate };
        }

        return prisma.attendance.findMany({
            where,
            select: {
                ...attendanceSelect,
                employee: { select: { fullName: true, employeeCode: true } }
            },
            orderBy: { date: "desc" },
            take: 100,
        });
    },
    ["attendance-list"],
    { tags: [TAGS.attendance], revalidate: 180 } // Increased from 60s to 3min
);

export const getLeavesCached = unstable_cache(
    async (params: { employeeId?: string; status?: string; recentDays?: number; take?: number }) => {
        const { employeeId, status, recentDays, take } = params;
        console.log("🗄️ [DATA LAYER] getLeavesCached called with params:", params);

        const where: any = {};

        if (employeeId) where.employeeId = employeeId;
        if (status && status !== "all") {
            const s = typeof status === 'string' ? status.toUpperCase() : status;
            if (["PENDING", "APPROVED", "REJECTED"].includes(s)) where.status = s;
        }

        // Handle recentDays filtering based on status
        if (recentDays && !isNaN(recentDays)) {
            const now = new Date();
            const threshold = new Date(now);
            threshold.setDate(now.getDate() - recentDays);
            // Normalize threshold to start of day to be inclusive
            threshold.setHours(0, 0, 0, 0);

            // For APPROVED status, filter by approvedAt (when it was approved)
            // For PENDING/REJECTED or no specific status, filter by createdAt (when it was created)
            if (status && status.toUpperCase() === "APPROVED") {
                where.approvedAt = { gte: threshold };
            } else {
                // For pending, rejected, or all statuses, use createdAt
                where.createdAt = { gte: threshold };
            }
            console.log("📅 [DATA LAYER] Date threshold:", threshold.toISOString());
        }

        console.log("🔎 [DATA LAYER] Prisma where clause:", JSON.stringify(where, null, 2));
        const takeCount = typeof take === 'number' && take > 0 ? take : 200;

        const results = await prisma.leaveRequest.findMany({
            where,
            select: {
                ...leaveSelect,
                employee: { select: { fullName: true, employeeCode: true, department: true, designation: true, id: true } }
            },
            orderBy: { createdAt: "desc" },
            take: takeCount,
        });

        console.log("💾 [DATA LAYER] Query returned", results.length, "results");
        return results;
    },
    ["leaves-list"],
    { tags: [TAGS.leaves], revalidate: 10 } // Reduced from 180s to 10s for faster admin dashboard updates
);
