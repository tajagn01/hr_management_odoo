import { prisma } from './lib/prisma';

async function resetAllData() {
  try {
    console.log('🔄 Starting Complete Data Reset...\n');

    // 1. Delete all attendance records
    console.log('📋 Deleting Attendance Records...');
    const attendanceCount = await prisma.attendance.deleteMany({});
    console.log(`   ✅ Deleted ${attendanceCount.count} attendance records`);

    // 2. Delete all leave requests
    console.log('\n🌴 Deleting Leave Requests...');
    const leaveCount = await prisma.leaveRequest.deleteMany({});
    console.log(`   ✅ Deleted ${leaveCount.count} leave requests`);

    // 3. Delete all monthly attendance aggregations
    console.log('\n📊 Deleting Monthly Attendance Aggregations...');
    const monthlyCount = await prisma.monthlyAttendance.deleteMany({});
    console.log(`   ✅ Deleted ${monthlyCount.count} monthly attendance records`);

    // 4. Delete all yearly attendance aggregations
    console.log('\n📈 Deleting Yearly Attendance Aggregations...');
    const yearlyCount = await prisma.yearlyAttendance.deleteMany({});
    console.log(`   ✅ Deleted ${yearlyCount.count} yearly attendance records`);

    // 5. Delete all notifications
    console.log('\n🔔 Deleting Notifications...');
    const notificationCount = await prisma.notification.deleteMany({});
    console.log(`   ✅ Deleted ${notificationCount.count} notifications`);

    // 6. Delete all payroll records (optional - uncomment if needed)
    // console.log('\n💰 Deleting Payroll Records...');
    // const payrollCount = await prisma.payroll.deleteMany({});
    // console.log(`   ✅ Deleted ${payrollCount.count} payroll records`);

    // 7. Show remaining data
    console.log('\n📊 Remaining Data:');
    const employeeCount = await prisma.employee.count();
    const userCount = await prisma.user.count();
    console.log(`   👥 Employees: ${employeeCount}`);
    console.log(`   👤 Users: ${userCount}`);

    console.log('\n✅ Data Reset Complete!');
    console.log('\n📝 Summary:');
    console.log(`   - Attendance records: ${attendanceCount.count} deleted`);
    console.log(`   - Leave requests: ${leaveCount.count} deleted`);
    console.log(`   - Monthly aggregations: ${monthlyCount.count} deleted`);
    console.log(`   - Yearly aggregations: ${yearlyCount.count} deleted`);
    console.log(`   - Notifications: ${notificationCount.count} deleted`);
    console.log(`   - Employees: ${employeeCount} kept`);
    console.log(`   - Users: ${userCount} kept`);

    console.log('\n💡 Next Steps:');
    console.log('   1. Employees can now mark fresh attendance');
    console.log('   2. Leave requests can be created from scratch');
    console.log('   3. All dashboards will show clean data');

  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete ALL data except employees and users!');
console.log('   - All attendance records');
console.log('   - All leave requests');
console.log('   - All monthly/yearly aggregations');
console.log('   - All notifications');
console.log('');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  resetAllData();
}, 3000);
