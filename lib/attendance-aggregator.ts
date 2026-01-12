/**
 * Attendance Aggregation Utility
 * Handles monthly and yearly attendance record aggregation
 */

import { prisma } from "@/lib/prisma";

interface DayWiseAttendance {
    date: string;
    status: string;
    hours: number;
}

interface MonthWiseAttendance {
    month: number;
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
    hours: number;
}

/**
 * Update monthly attendance record for an employee
 * Called after check-out or at end of month
 */
export async function updateMonthlyAttendance(
    employeeId: string,
    date: Date
): Promise<void> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    // Get first and last day of the month
    const firstDay = new Date(year, month - 1, 1);
    firstDay.setHours(0, 0, 0, 0);
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch all attendance records for this employee in this month
    const attendanceRecords = await prisma.attendance.findMany({
        where: {
            employeeId,
            date: {
                gte: firstDay,
                lte: lastDay,
            },
        },
        orderBy: {
            date: "asc",
        },
    });

    // Calculate statistics
    const presentDays = attendanceRecords.filter(
        (a) => a.status === "PRESENT"
    ).length;
    const absentDays = attendanceRecords.filter(
        (a) => a.status === "ABSENT"
    ).length;
    const halfDays = attendanceRecords.filter(
        (a) => a.status === "HALF_DAY"
    ).length;
    const leaveDays = attendanceRecords.filter(
        (a) => a.status === "LEAVE"
    ).length;

    const totalWorkingHours = attendanceRecords.reduce((sum, record) => {
        return sum + (record.workingHours || 0);
    }, 0);

    // Standard working days per month (can be customized)
    const totalWorkingDays = 22;

    // Calculate attendance percentage
    const attendancePercent =
        totalWorkingDays > 0
            ? Math.round(((presentDays + halfDays * 0.5) / totalWorkingDays) * 100 * 100) / 100
            : 0;

    // Create day-wise data
    const dayWiseData: DayWiseAttendance[] = attendanceRecords.map((record) => ({
        date: record.date.toISOString().split("T")[0],
        status: record.status,
        hours: record.workingHours || 0,
    }));

    // Upsert monthly attendance record
    await prisma.monthlyAttendance.upsert({
        where: {
            employeeId_year_month: {
                employeeId,
                year,
                month,
            },
        },
        update: {
            presentDays,
            absentDays,
            halfDays,
            leaveDays,
            totalWorkingDays,
            totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
            attendancePercent,
            dayWiseData: dayWiseData as any,
            updatedAt: new Date(),
        },
        create: {
            employeeId,
            year,
            month,
            presentDays,
            absentDays,
            halfDays,
            leaveDays,
            totalWorkingDays,
            totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
            attendancePercent,
            dayWiseData: dayWiseData as any,
        },
    });

    console.log(
        `✅ Updated monthly attendance for employee ${employeeId}: ${year}-${month}`
    );
}

/**
 * Update yearly attendance record for an employee
 * Called at end of year or on demand
 */
export async function updateYearlyAttendance(
    employeeId: string,
    year: number
): Promise<void> {
    // Fetch all monthly attendance records for this year
    const monthlyRecords = await prisma.monthlyAttendance.findMany({
        where: {
            employeeId,
            year,
        },
        orderBy: {
            month: "asc",
        },
    });

    if (monthlyRecords.length === 0) {
        console.log(`No monthly records found for employee ${employeeId} in ${year}`);
        return;
    }

    // Calculate yearly totals
    const totalWorkingDays = monthlyRecords.reduce(
        (sum, record) => sum + record.totalWorkingDays,
        0
    );
    const presentDays = monthlyRecords.reduce(
        (sum, record) => sum + record.presentDays,
        0
    );
    const absentDays = monthlyRecords.reduce(
        (sum, record) => sum + record.absentDays,
        0
    );
    const halfDays = monthlyRecords.reduce(
        (sum, record) => sum + record.halfDays,
        0
    );
    const leaveDays = monthlyRecords.reduce(
        (sum, record) => sum + record.leaveDays,
        0
    );
    const totalWorkingHours = monthlyRecords.reduce(
        (sum, record) => sum + record.totalWorkingHours,
        0
    );

    // Calculate average attendance percentage
    const avgAttendancePercent =
        monthlyRecords.length > 0
            ? Math.round(
                (monthlyRecords.reduce(
                    (sum, record) => sum + record.attendancePercent,
                    0
                ) /
                    monthlyRecords.length) *
                100
            ) / 100
            : 0;

    // Create month-wise data
    const monthWiseData: MonthWiseAttendance[] = monthlyRecords.map((record) => ({
        month: record.month,
        present: record.presentDays,
        absent: record.absentDays,
        halfDay: record.halfDays,
        leave: record.leaveDays,
        hours: record.totalWorkingHours,
    }));

    // Upsert yearly attendance record
    await prisma.yearlyAttendance.upsert({
        where: {
            employeeId_year: {
                employeeId,
                year,
            },
        },
        update: {
            totalWorkingDays,
            presentDays,
            absentDays,
            halfDays,
            leaveDays,
            totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
            avgAttendancePercent,
            monthWiseData: monthWiseData as any,
            updatedAt: new Date(),
        },
        create: {
            employeeId,
            year,
            totalWorkingDays,
            presentDays,
            absentDays,
            halfDays,
            leaveDays,
            totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
            avgAttendancePercent,
            monthWiseData: monthWiseData as any,
        },
    });

    console.log(
        `✅ Updated yearly attendance for employee ${employeeId}: ${year}`
    );
}

/**
 * Aggregate monthly attendance for all employees
 * Used by cron job at end of month
 */
export async function aggregateAllEmployeesMonthly(
    year: number,
    month: number
): Promise<void> {
    console.log(`Starting monthly aggregation for ${year}-${month}...`);

    const employees = await prisma.employee.findMany({
        select: { id: true, fullName: true },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
        try {
            const date = new Date(year, month - 1, 15); // Mid-month date
            await updateMonthlyAttendance(employee.id, date);
            successCount++;
        } catch (error) {
            console.error(
                `Error aggregating for employee ${employee.fullName}:`,
                error
            );
            errorCount++;
        }
    }

    console.log(
        `✅ Monthly aggregation complete: ${successCount} success, ${errorCount} errors`
    );
}

/**
 * Aggregate yearly attendance for all employees
 * Used by cron job at end of year
 */
export async function aggregateAllEmployeesYearly(year: number): Promise<void> {
    console.log(`Starting yearly aggregation for ${year}...`);

    const employees = await prisma.employee.findMany({
        select: { id: true, fullName: true },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
        try {
            await updateYearlyAttendance(employee.id, year);
            successCount++;
        } catch (error) {
            console.error(
                `Error aggregating yearly for employee ${employee.fullName}:`,
                error
            );
            errorCount++;
        }
    }

    console.log(
        `✅ Yearly aggregation complete: ${successCount} success, ${errorCount} errors`
    );
}
