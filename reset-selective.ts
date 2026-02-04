import { prisma } from './lib/prisma';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function selectiveReset() {
  try {
    console.log('🔄 Selective Data Reset Tool\n');
    console.log('Choose what to reset:\n');

    const resetAttendance = await question('Delete all attendance records? (y/n): ');
    const resetLeaves = await question('Delete all leave requests? (y/n): ');
    const resetMonthly = await question('Delete monthly aggregations? (y/n): ');
    const resetYearly = await question('Delete yearly aggregations? (y/n): ');
    const resetNotifications = await question('Delete all notifications? (y/n): ');
    const resetPayroll = await question('Delete all payroll records? (y/n): ');

    console.log('\n🔄 Starting selective reset...\n');

    let totalDeleted = 0;

    if (resetAttendance.toLowerCase() === 'y') {
      console.log('📋 Deleting Attendance Records...');
      const count = await prisma.attendance.deleteMany({});
      console.log(`   ✅ Deleted ${count.count} records`);
      totalDeleted += count.count;
    }

    if (resetLeaves.toLowerCase() === 'y') {
      console.log('\n🌴 Deleting Leave Requests...');
      const count = await prisma.leaveRequest.deleteMany({});
      console.log(`   ✅ Deleted ${count.count} records`);
      totalDeleted += count.count;
    }

    if (resetMonthly.toLowerCase() === 'y') {
      console.log('\n📊 Deleting Monthly Aggregations...');
      const count = await prisma.monthlyAttendance.deleteMany({});
      console.log(`   ✅ Deleted ${count.count} records`);
      totalDeleted += count.count;
    }

    if (resetYearly.toLowerCase() === 'y') {
      console.log('\n📈 Deleting Yearly Aggregations...');
      const count = await prisma.yearlyAttendance.deleteMany({});
      console.log(`   ✅ Deleted ${count.count} records`);
      totalDeleted += count.count;
    }

    if (resetNotifications.toLowerCase() === 'y') {
      console.log('\n🔔 Deleting Notifications...');
      const count = await prisma.notification.deleteMany({});
      console.log(`   ✅ Deleted ${count.count} records`);
      totalDeleted += count.count;
    }

    if (resetPayroll.toLowerCase() === 'y') {
      console.log('\n💰 Deleting Payroll Records...');
      const count = await prisma.payroll.deleteMany({});
      console.log(`   ✅ Deleted ${count.count} records`);
      totalDeleted += count.count;
    }

    console.log(`\n✅ Selective Reset Complete! Total records deleted: ${totalDeleted}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

selectiveReset();
