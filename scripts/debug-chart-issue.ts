import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugAttendanceChart() {
    console.log('🔍 Debugging Attendance Chart Data...\n');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    console.log(`📅 Date: ${today.toDateString()}\n`);

    try {
        // 1. Get total employees
        const totalEmployees = await prisma.employee.count();
        console.log(`👥 Total Employees in DB: ${totalEmployees}\n`);

        // 2. Get attendance for today
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                date: today
            },
            include: {
                employee: {
                    select: {
                        fullName: true
                    }
                }
            }
        });

        console.log(`📊 Attendance Records for Today: ${attendanceRecords.length}\n`);

        // 3. Count by status
        const statusCounts = {
            PRESENT: 0,
            LATE: 0,
            ABSENT: 0,
            HALF_DAY: 0,
            LEAVE: 0,
            HOLIDAY: 0
        };

        attendanceRecords.forEach(record => {
            const status = record.status as keyof typeof statusCounts;
            if (status in statusCounts) {
                statusCounts[status]++;
            }
        });

        console.log('📈 Status Breakdown:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            if (count > 0) {
                console.log(`   ${status}: ${count}`);
            }
        });

        // 4. Calculate percentage (CORRECT WAY)
        const presentCount = statusCounts.PRESENT + statusCounts.LATE + statusCounts.HALF_DAY;
        const correctPercentage = Math.round((presentCount / totalEmployees) * 100);

        console.log(`\n✅ CORRECT Calculation:`);
        console.log(`   Present/Late/Half-Day: ${presentCount}`);
        console.log(`   Total Employees: ${totalEmployees}`);
        console.log(`   Percentage: ${correctPercentage}%`);

        // 5. Show what WRONG calculation would be
        const employeesWithRecords = attendanceRecords.length;
        const wrongPercentage = employeesWithRecords > 0
            ? Math.round((presentCount / employeesWithRecords) * 100)
            : 0;

        console.log(`\n❌ WRONG Calculation (using only employees with records):`);
        console.log(`   Present/Late/Half-Day: ${presentCount}`);
        console.log(`   Employees with Records: ${employeesWithRecords}`);
        console.log(`   Percentage: ${wrongPercentage}%`);

        // 6. Show missing employees
        const employeesWithAttendance = new Set(attendanceRecords.map(r => r.employeeId));
        const allEmployees = await prisma.employee.findMany({
            select: {
                id: true,
                fullName: true
            }
        });

        const missingEmployees = allEmployees.filter(emp => !employeesWithAttendance.has(emp.id));

        if (missingEmployees.length > 0) {
            console.log(`\n⚠️  Employees WITHOUT attendance record (${missingEmployees.length}):`);
            missingEmployees.forEach(emp => {
                console.log(`   - ${emp.fullName} (should be counted as ABSENT)`);
            });
        }

        // 7. Show the issue
        console.log(`\n💡 THE ISSUE:`);
        if (wrongPercentage === 100 && correctPercentage < 100) {
            console.log(`   Chart is showing: ${wrongPercentage}% (WRONG)`);
            console.log(`   Should show: ${correctPercentage}% (CORRECT)`);
            console.log(`\n   Problem: Chart is dividing by ${employeesWithRecords} instead of ${totalEmployees}`);
        } else {
            console.log(`   Chart calculation appears correct.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugAttendanceChart()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
