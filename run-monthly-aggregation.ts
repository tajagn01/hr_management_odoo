import { prisma } from './lib/prisma';
import { aggregateAllEmployeesMonthly } from './lib/attendance-aggregator';

async function runMonthlyAggregation() {
  try {
    console.log('📊 Running Monthly Attendance Aggregation...\n');

    // Aggregate for January 2026
    const year = 2026;
    const month = 1; // January

    console.log(`Processing: January ${year}\n`);

    // Get all employees
    const employees = await prisma.employee.findMany({
      where: {
        user: {
          role: 'EMPLOYEE'
        }
      },
      select: {
        id: true,
        fullName: true,
        employeeCode: true
      }
    });

    console.log(`👥 Found ${employees.length} employees\n`);

    // Run aggregation for all employees
    await aggregateAllEmployeesMonthly(year, month);

    console.log('✅ Monthly aggregation completed!\n');

    // Verify the results
    const aggregationCount = await prisma.monthlyAttendance.count({
      where: {
        year,
        month
      }
    });

    console.log(`📊 Created ${aggregationCount} monthly aggregation records\n`);

    // Show sample data
    const samples = await prisma.monthlyAttendance.findMany({
      where: {
        year,
        month
      },
      include: {
        employee: {
          select: {
            fullName: true,
            employeeCode: true
          }
        }
      },
      take: 3
    });

    console.log('📝 Sample Results:\n');
    samples.forEach((record, idx) => {
      console.log(`${idx + 1}. ${record.employee.fullName} (${record.employee.employeeCode})`);
      console.log(`   Present Days: ${record.presentDays}/${record.totalWorkingDays}`);
      console.log(`   Absent Days: ${record.absentDays}`);
      console.log(`   Leave Days: ${record.leaveDays}`);
      console.log(`   Attendance %: ${record.attendancePercent.toFixed(1)}%`);
      console.log(`   Working Hours: ${record.totalWorkingHours.toFixed(1)}h`);
      
      if (record.dayWiseData) {
        const dayWise = record.dayWiseData as any[];
        console.log(`   Day-wise entries: ${dayWise.length}`);
      }
      console.log('');
    });

    console.log('✅ The attendance chart should now show data for January 2026!');
    console.log('💡 Refresh your admin dashboard to see the updated chart.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMonthlyAggregation();
