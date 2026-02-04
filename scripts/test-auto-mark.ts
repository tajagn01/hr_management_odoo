import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Test script for auto-mark attendance functionality
 * This simulates running the auto-mark script for testing purposes
 */
async function testAutoMarkAttendance() {
    console.log('🧪 Testing Random Auto-Mark Attendance Functionality...');
    
    // You can change this date to test different scenarios
    const testDate = new Date('2026-02-04T17:00:00'); // Current date: Feb 4, 2026 at 5 PM
    
    console.log(`📅 Testing for date: ${testDate.toDateString()}`);
    console.log(`⏰ Testing at time: ${testDate.toTimeString()}`);
    
    try {
        // Get start and end of test day
        const startOfTestDay = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate(), 0, 0, 0, 0);
        const endOfTestDay = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate(), 23, 59, 59, 999);

        // Check if there's an attendance config for the day
        const attendanceConfig = await prisma.attendanceConfig.findUnique({
            where: { date: startOfTestDay }
        });

        console.log(`\n🔒 Attendance Lock Status:`);
        if (attendanceConfig) {
            console.log(`   Auto-marked: ${attendanceConfig.autoMarkedToday ? 'Yes' : 'No'}`);
            console.log(`   Manual entry locked: ${attendanceConfig.lockManualEntry ? 'Yes' : 'No'}`);
        } else {
            console.log(`   No attendance config found - manual entry allowed`);
        }

        // Get all employees and their attendance for the test date
        const employees = await prisma.employee.findMany({
            include: { 
                user: true,
                attendance: {
                    where: {
                        date: {
                            gte: startOfTestDay,
                            lte: endOfTestDay
                        }
                    }
                }
            }
        });

        console.log(`\n👥 Found ${employees.length} employees`);
        console.log('📊 Current attendance status:');
        
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let needsAutoMark = 0;
        let autoMarkedCount = 0;

        employees.forEach(employee => {
            const hasAttendance = employee.attendance && employee.attendance.length > 0;
            if (hasAttendance) {
                const attendance = employee.attendance[0];
                const statusEmoji = attendance.status === 'PRESENT' ? '✅' : attendance.status === 'LATE' ? '⏰' : '❌';
                const autoText = attendance.autoMarked ? ' (Auto-marked)' : ' (Manual)';
                console.log(`   ${statusEmoji} ${employee.fullName}: ${attendance.status}${autoText}`);
                
                if (attendance.status === 'PRESENT') presentCount++;
                else if (attendance.status === 'LATE') lateCount++;
                else if (attendance.status === 'ABSENT') absentCount++;
                
                if (attendance.autoMarked) autoMarkedCount++;
            } else {
                console.log(`   ❌ ${employee.fullName}: No attendance recorded`);
                needsAutoMark++;
            }
        });

        console.log(`\n📈 Summary:`);
        console.log(`   Present: ${presentCount}`);
        console.log(`   Late: ${lateCount}`);
        console.log(`   Absent: ${absentCount}`);
        console.log(`   No record: ${needsAutoMark}`);
        console.log(`   Auto-marked: ${autoMarkedCount}`);

        if (needsAutoMark > 0 && !attendanceConfig?.autoMarkedToday) {
            console.log(`\n🤖 Would randomly auto-mark ${needsAutoMark} employees if script runs now`);
            console.log(`   Expected distribution: ~70% Present, ~20% Absent, ~10% Late`);
        } else if (attendanceConfig?.autoMarkedToday) {
            console.log(`\n✅ Auto-marking already completed for today`);
            console.log(`   Manual attendance entry is ${attendanceConfig.lockManualEntry ? 'LOCKED' : 'allowed'}`);
        } else {
            console.log(`\n✅ All employees already have attendance marked`);
        }

        // Show what would happen if someone tries to manually mark attendance
        if (attendanceConfig?.lockManualEntry) {
            console.log(`\n🚫 Manual Check-In/Check-Out Status: BLOCKED`);
            console.log(`   Reason: Auto-marking has been completed for today`);
        } else {
            console.log(`\n✅ Manual Check-In/Check-Out Status: ALLOWED`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
if (require.main === module) {
    testAutoMarkAttendance()
        .then(() => {
            console.log('\n🎉 Test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test failed:', error);
            process.exit(1);
        });
}