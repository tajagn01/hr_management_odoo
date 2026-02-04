import { prisma } from './lib/prisma';

async function checkAttendanceDates() {
  try {
    console.log('🔍 Checking Attendance Data for January 2026...\n');

    const januaryStart = new Date(2026, 0, 1);
    const februaryStart = new Date(2026, 1, 1);

    // Get all attendance records for January
    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: januaryStart,
          lt: februaryStart
        }
      },
      orderBy: {
        date: 'asc'
      },
      select: {
        date: true,
        status: true,
        employeeId: true
      }
    });

    console.log(`📊 Total Records: ${records.length}\n`);

    if (records.length === 0) {
      console.log('❌ No attendance records found for January 2026!');
      console.log('\n💡 Solution: Run the seeding script');
      console.log('   npx tsx seed-january-data.ts');
      return;
    }

    // Group by date
    const byDate = new Map<string, number>();
    records.forEach(record => {
      const dateStr = new Date(record.date).toDateString();
      byDate.set(dateStr, (byDate.get(dateStr) || 0) + 1);
    });

    // Show date range
    const dates = Array.from(byDate.keys()).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    console.log(`📅 Date Range:`);
    console.log(`   First record: ${firstDate}`);
    console.log(`   Last record: ${lastDate}`);
    console.log(`   Days with data: ${dates.length}\n`);

    // Show day-by-day breakdown
    console.log('📋 Day-by-Day Breakdown:\n');
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2026, 0, day);
      const dateStr = date.toDateString();
      const count = byDate.get(dateStr) || 0;
      
      const dayOfWeek = date.getDay();
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
      
      if (count > 0) {
        console.log(`   Day ${day.toString().padStart(2, ' ')} (${dayName}): ${count} records ✅`);
      } else {
        if (dayOfWeek === 0) {
          console.log(`   Day ${day.toString().padStart(2, ' ')} (${dayName}): Sunday (skipped)`);
        } else {
          console.log(`   Day ${day.toString().padStart(2, ' ')} (${dayName}): 0 records ❌ MISSING`);
        }
      }
    }

    // Count missing days
    const missingDays = [];
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2026, 0, day);
      const dateStr = date.toDateString();
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek !== 0 && !byDate.has(dateStr)) {
        missingDays.push(day);
      }
    }

    if (missingDays.length > 0) {
      console.log(`\n⚠️  Missing Data for ${missingDays.length} working days:`);
      console.log(`   Days: ${missingDays.join(', ')}`);
      console.log('\n💡 This is why the chart shows 0% for those days!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendanceDates();
