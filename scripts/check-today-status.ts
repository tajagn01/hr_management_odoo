import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTodayAttendance() {
    console.log('🔍 Checking Today\'s Attendance Status...\n');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`📅 Date: ${today.toDateString()}`);
    console.log(`⏰ Current Time: ${now.toLocaleTimeString()}\n`);

    try {
        // Check attendance config
        const config = await prisma.attendanceConfig.findUnique({
            where: { date: today }
        });

        console.log('🔒 Auto-Mark Status:');
        if (config) {
            console.log(`   Auto-marked today: ${config.autoMarkedToday ? 'YES ✅' : 'NO ❌'}`);
            console.log(`   Manual entry locked: ${config.lockManualEntry ? 'YES 🔒' : 'NO 🔓'}`);
        } else {
            console.log(`   No config found - Auto-marking NOT set up yet ⚠️`);
        }

        // Count attendance records
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: today,
                    lte: endOfDay
                }
            },
            include: {
                employee: {
                    select: {
                        fullName: true
                    }
                }
            }
        });

        console.log(`\n📊 Attendance Records for Today:`);
        console.log(`   Total records: ${attendanceRecords.length}`);

        const autoMarked = attendanceRecords.filter(r => r.autoMarked);
        const manual = attendanceRecords.filter(r => !r.autoMarked);

        console.log(`   Auto-marked: ${autoMarked.length}`);
        console.log(`   Manual: ${manual.length}`);

        if (attendanceRecords.length > 0) {
            console.log(`\n👥 Employee Status:`);
            attendanceRecords.forEach(record => {
                const type = record.autoMarked ? '🤖 Auto' : '👤 Manual';
                const statusIcon = record.status === 'PRESENT' ? '✅' :
                    record.status === 'LATE' ? '⏰' : '❌';
                console.log(`   ${statusIcon} ${type} - ${record.employee.fullName}: ${record.status}`);
            });
        } else {
            console.log(`\n⚠️  NO ATTENDANCE RECORDS FOUND FOR TODAY!`);
            console.log(`\n💡 Why auto-marking didn't run:`);
            console.log(`   1. Auto-mark script is NOT scheduled (no cron job/task scheduler)`);
            console.log(`   2. Script only runs if you set it up in Windows Task Scheduler`);
            console.log(`   3. OR you need to run it manually: npx tsx scripts/auto-mark-attendance.ts`);
        }

        // Check total employees
        const totalEmployees = await prisma.employee.count();
        console.log(`\n📈 Summary:`);
        console.log(`   Total Employees: ${totalEmployees}`);
        console.log(`   Marked Today: ${attendanceRecords.length}`);
        console.log(`   Missing: ${totalEmployees - attendanceRecords.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTodayAttendance()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
