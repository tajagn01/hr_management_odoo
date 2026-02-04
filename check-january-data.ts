import { prisma } from './lib/prisma';

async function checkJanuaryData() {
  try {
    console.log('🔍 Checking January 2026 Data...\n');

    // Check attendance records
    const januaryStart = new Date(2026, 0, 1); // Jan 1, 2026
    const februaryStart = new Date(2026, 1, 1); // Feb 1, 2026

    const attendanceCount = await prisma.attendance.count({
      where: {
        date: {
          gte: januaryStart,
          lt: februaryStart
        }
      }
    });

    console.log(`📋 Attendance Records in January: ${attendanceCount}`);

    if (attendanceCount === 0) {
      console.log('   ⚠️  No attendance records found!');
      console.log('   💡 Run: npx tsx seed-january-data.ts');
      return;
    }

    // Check monthly aggregation
    const monthlyAgg = await prisma.monthlyAttendance.count({
      where: {
        year: 2026,
        month: 1 // January
      }
    });

    console.log(`\n📊 Monthly Aggregation Records: ${monthlyAgg}`);

    if (monthlyAgg === 0) {
      console.log('   ⚠️  No monthly aggregation found!');
      console.log('   ❌ This is why the graph is empty!');
      console.log('\n💡 Solution:');
      console.log('   The attendance chart needs monthly aggregation data.');
      console.log('   Run the aggregation manually:\n');
      console.log('   Option 1: From Admin Dashboard');
      console.log('      → Go to Reports tab');
      console.log('      → Click "Run Monthly Aggregation"\n');
      console.log('   Option 2: Run aggregation script');
      console.log('      → npx tsx run-monthly-aggregation.ts');
    } else {
      console.log('   ✅ Monthly aggregation exists');
      
      // Show sample data
      const sample = await prisma.monthlyAttendance.findFirst({
        where: {
          year: 2026,
          month: 1
        },
        include: {
          employee: {
            select: {
              fullName: true
            }
          }
        }
      });

      if (sample) {
        console.log('\n📝 Sample Aggregation:');
        console.log(`   Employee: ${sample.employee.fullName}`);
        console.log(`   Present Days: ${sample.presentDays}`);
        console.log(`   Total Working Days: ${sample.totalWorkingDays}`);
        console.log(`   Attendance %: ${sample.attendancePercent}%`);
        
        if (sample.dayWiseData) {
          const dayWise = sample.dayWiseData as any[];
          console.log(`   Day-wise entries: ${dayWise.length}`);
        }
      }
    }

    // Check leave requests
    const leaveCount = await prisma.leaveRequest.count({
      where: {
        startDate: {
          gte: januaryStart,
          lt: februaryStart
        }
      }
    });

    console.log(`\n🌴 Leave Requests in January: ${leaveCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJanuaryData();
