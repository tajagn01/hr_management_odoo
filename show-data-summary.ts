import { prisma } from './lib/prisma';

async function showDataSummary() {
  try {
    console.log('📊 Current Database Summary\n');
    console.log('═'.repeat(50));

    // Users and Employees
    console.log('\n👥 USERS & EMPLOYEES:');
    const totalUsers = await prisma.user.count();
    const totalEmployees = await prisma.employee.count();
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const managerCount = await prisma.user.count({ where: { role: 'MANAGER' } });
    const employeeCount = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
    
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Total Employees: ${totalEmployees}`);
    console.log(`   - Admins: ${adminCount}`);
    console.log(`   - Managers: ${managerCount}`);
    console.log(`   - Regular Employees: ${employeeCount}`);

    // Attendance
    console.log('\n📋 ATTENDANCE:');
    const totalAttendance = await prisma.attendance.count();
    const presentCount = await prisma.attendance.count({ where: { status: 'PRESENT' } });
    const absentCount = await prisma.attendance.count({ where: { status: 'ABSENT' } });
    const lateCount = await prisma.attendance.count({ where: { status: 'LATE' } });
    const leaveCount = await prisma.attendance.count({ where: { status: 'LEAVE' } });
    
    console.log(`   Total Records: ${totalAttendance}`);
    console.log(`   - Present: ${presentCount}`);
    console.log(`   - Absent: ${absentCount}`);
    console.log(`   - Late: ${lateCount}`);
    console.log(`   - Leave: ${leaveCount}`);

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await prisma.attendance.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    console.log(`   Today's Records: ${todayAttendance}`);

    // Leave Requests
    console.log('\n🌴 LEAVE REQUESTS:');
    const totalLeaves = await prisma.leaveRequest.count();
    const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    const approvedLeaves = await prisma.leaveRequest.count({ where: { status: 'APPROVED' } });
    const rejectedLeaves = await prisma.leaveRequest.count({ where: { status: 'REJECTED' } });
    
    console.log(`   Total Requests: ${totalLeaves}`);
    console.log(`   - Pending: ${pendingLeaves}`);
    console.log(`   - Approved: ${approvedLeaves}`);
    console.log(`   - Rejected: ${rejectedLeaves}`);

    // Aggregations
    console.log('\n📊 AGGREGATIONS:');
    const monthlyAgg = await prisma.monthlyAttendance.count();
    const yearlyAgg = await prisma.yearlyAttendance.count();
    
    console.log(`   Monthly Records: ${monthlyAgg}`);
    console.log(`   Yearly Records: ${yearlyAgg}`);

    // Notifications
    console.log('\n🔔 NOTIFICATIONS:');
    const totalNotifications = await prisma.notification.count();
    const unreadNotifications = await prisma.notification.count({ where: { read: false } });
    
    console.log(`   Total: ${totalNotifications}`);
    console.log(`   Unread: ${unreadNotifications}`);

    // Payroll
    console.log('\n💰 PAYROLL:');
    const totalPayroll = await prisma.payroll.count();
    console.log(`   Total Records: ${totalPayroll}`);

    // Holidays
    console.log('\n🏖️  HOLIDAYS:');
    const totalHolidays = await prisma.holiday.count();
    console.log(`   Total: ${totalHolidays}`);

    console.log('\n' + '═'.repeat(50));
    console.log('\n💡 To reset data, run:');
    console.log('   npx tsx reset-all-data.ts       (Reset everything)');
    console.log('   npx tsx reset-selective.ts      (Choose what to reset)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showDataSummary();
