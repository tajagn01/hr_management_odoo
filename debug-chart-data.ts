import { prisma } from './lib/prisma';

async function debugChartData() {
  try {
    console.log('🐛 Debugging Chart Data Processing...\n');

    // Simulate what the chart does
    const year = 2026;
    const month = 1; // January

    // Calculate date range (same as chart)
    const startDate = new Date(year, month - 1, 1); // First day of month
    const endDate = new Date(year, month, 0); // Last day of month
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log('📅 Date Range (as chart calculates):');
    console.log(`   Start: ${startDate.toISOString()}`);
    console.log(`   End: ${endDate.toISOString()}\n`);

    // Fetch records (same as chart)
    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
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

    console.log(`📊 Records Fetched: ${records.length}\n`);

    if (records.length === 0) {
      console.log('❌ No records fetched!');
      console.log('   This is why the chart is empty.');
      return;
    }

    // Process records (same as chart)
    const daysInMonth = new Date(year, month, 0).getDate();
    const counts = new Array(daysInMonth).fill(0);

    console.log('🔄 Processing records (simulating chart logic):\n');

    records.forEach((record, idx) => {
      const recordDate = new Date(record.date);
      const day = recordDate.getDate();
      
      if (idx < 5) { // Show first 5 for debugging
        console.log(`   Record ${idx + 1}:`);
        console.log(`      Stored date: ${record.date}`);
        console.log(`      Parsed date: ${recordDate.toISOString()}`);
        console.log(`      Day extracted: ${day}`);
        console.log(`      Status: ${record.status}`);
      }
      
      if (day >= 1 && day <= daysInMonth) {
        const status = (record.status || '').toString().toUpperCase();
        if (status === 'PRESENT' || status === 'LATE' || status === 'HALF_DAY') {
          counts[day - 1] += 1;
        }
      }
    });

    console.log('\n📊 Day-wise counts (what chart should show):\n');
    for (let i = 0; i < daysInMonth; i++) {
      const day = i + 1;
      const count = counts[i];
      const percentage = Math.round((count / 10) * 100);
      
      if (count > 0) {
        console.log(`   Day ${day.toString().padStart(2, ' ')}: ${count} present (${percentage}%)`);
      } else {
        console.log(`   Day ${day.toString().padStart(2, ' ')}: 0 present (0%) ❌`);
      }
    }

    // Check for timezone issues
    console.log('\n🌍 Timezone Check:');
    const sampleRecord = records[0];
    const storedDate = new Date(sampleRecord.date);
    console.log(`   Stored: ${sampleRecord.date}`);
    console.log(`   As Date object: ${storedDate}`);
    console.log(`   ISO String: ${storedDate.toISOString()}`);
    console.log(`   Local String: ${storedDate.toLocaleString()}`);
    console.log(`   getDate(): ${storedDate.getDate()}`);
    console.log(`   getUTCDate(): ${storedDate.getUTCDate()}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugChartData();
