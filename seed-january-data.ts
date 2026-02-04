import { prisma } from './lib/prisma';

async function seedJanuaryData() {
  try {
    console.log('🌱 Seeding January 2026 Data...\n');

    // Get all employees (excluding managers/admins for attendance)
    const allEmployees = await prisma.employee.findMany({
      where: {
        user: {
          role: 'EMPLOYEE'
        }
      },
      include: {
        user: true
      }
    });

    console.log(`👥 Found ${allEmployees.length} employees\n`);

    // Find john and tajagn
    const john = allEmployees.find(e => 
      e.fullName.toLowerCase().includes('jon') || 
      e.user?.email?.toLowerCase().includes('john')
    );
    
    const tajagn = allEmployees.find(e => 
      e.fullName.toLowerCase().includes('tajagn')
    );

    if (!john) {
      console.log('⚠️  Warning: Could not find john');
    } else {
      console.log(`✅ Found john: ${john.fullName} (${john.employeeCode})`);
    }

    if (!tajagn) {
      console.log('⚠️  Warning: Could not find tajagn');
    } else {
      console.log(`✅ Found tajagn: ${tajagn.fullName} (${tajagn.employeeCode})`);
    }

    console.log('\n📅 Creating January 2026 Attendance...\n');

    // January 2026 has 31 days
    const year = 2026;
    const month = 0; // January (0-indexed)
    const daysInJanuary = 31;

    let totalAttendanceCreated = 0;

    // Create attendance for each day in January
    for (let day = 1; day <= daysInJanuary; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Skip Sundays (day 0)
      if (dayOfWeek === 0) {
        console.log(`   Day ${day}: Sunday - Skipped`);
        continue;
      }

      console.log(`   Day ${day} (${date.toDateString()}):`);

      // Create attendance for each employee
      for (const employee of allEmployees) {
        // Random attendance pattern
        const rand = Math.random();
        
        let status: string;
        let checkIn: Date | null = null;
        let checkOut: Date | null = null;
        let workingHours: number | null = null;

        if (rand < 0.75) {
          // 75% chance: PRESENT
          status = 'PRESENT';
          
          // Random check-in time between 8:30 AM and 9:30 AM
          checkIn = new Date(date);
          checkIn.setHours(8, 30 + Math.floor(Math.random() * 60), 0, 0);
          
          // Random check-out time between 5:00 PM and 6:30 PM
          checkOut = new Date(date);
          checkOut.setHours(17, Math.floor(Math.random() * 90), 0, 0);
          
          // Calculate working hours
          workingHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          workingHours = Math.round(workingHours * 100) / 100;
          
        } else if (rand < 0.85) {
          // 10% chance: LATE
          status = 'LATE';
          
          // Check-in after 9:30 AM (late)
          checkIn = new Date(date);
          checkIn.setHours(9, 30 + Math.floor(Math.random() * 60), 0, 0);
          
          checkOut = new Date(date);
          checkOut.setHours(17, Math.floor(Math.random() * 90), 0, 0);
          
          workingHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          workingHours = Math.round(workingHours * 100) / 100;
          
        } else if (rand < 0.92) {
          // 7% chance: HALF_DAY
          status = 'HALF_DAY';
          
          checkIn = new Date(date);
          checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
          
          // Check out early (around 1-2 PM)
          checkOut = new Date(date);
          checkOut.setHours(13, Math.floor(Math.random() * 60), 0, 0);
          
          workingHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          workingHours = Math.round(workingHours * 100) / 100;
          
        } else {
          // 8% chance: ABSENT
          status = 'ABSENT';
          checkIn = null;
          checkOut = null;
          workingHours = null;
        }

        // Create attendance record
        await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            date: date,
            status: status as any,
            checkIn: checkIn,
            checkOut: checkOut,
            workingHours: workingHours
          }
        });

        totalAttendanceCreated++;
      }

      console.log(`      Created ${allEmployees.length} attendance records`);
    }

    console.log(`\n✅ Created ${totalAttendanceCreated} attendance records for January 2026\n`);

    // Create leave requests for john and tajagn
    console.log('🌴 Creating Leave Requests...\n');

    let leavesCreated = 0;

    if (john) {
      // John's leave: Jan 15-17, 2026 (3 days) - SICK leave
      const johnLeave = await prisma.leaveRequest.create({
        data: {
          employeeId: john.id,
          type: 'SICK',
          startDate: new Date(2026, 0, 15), // Jan 15
          endDate: new Date(2026, 0, 17),   // Jan 17
          days: 3,
          reason: 'Flu and fever',
          status: 'APPROVED',
          approvedBy: 'admin',
          approvedAt: new Date(2026, 0, 14) // Approved on Jan 14
        }
      });

      console.log(`✅ Created leave for ${john.fullName}:`);
      console.log(`   Type: SICK`);
      console.log(`   Dates: Jan 15-17, 2026 (3 days)`);
      console.log(`   Status: APPROVED`);
      console.log(`   Reason: Flu and fever\n`);

      // Update attendance records for john's leave days to LEAVE status
      await prisma.attendance.updateMany({
        where: {
          employeeId: john.id,
          date: {
            gte: new Date(2026, 0, 15),
            lte: new Date(2026, 0, 17)
          }
        },
        data: {
          status: 'LEAVE',
          checkIn: null,
          checkOut: null,
          workingHours: null
        }
      });

      leavesCreated++;
    }

    if (tajagn) {
      // Tajagn's leave: Jan 22-24, 2026 (3 days) - PAID leave
      const tajagnLeave = await prisma.leaveRequest.create({
        data: {
          employeeId: tajagn.id,
          type: 'PAID',
          startDate: new Date(2026, 0, 22), // Jan 22
          endDate: new Date(2026, 0, 24),   // Jan 24
          days: 3,
          reason: 'Family function',
          status: 'APPROVED',
          approvedBy: 'admin',
          approvedAt: new Date(2026, 0, 21) // Approved on Jan 21
        }
      });

      console.log(`✅ Created leave for ${tajagn.fullName}:`);
      console.log(`   Type: PAID`);
      console.log(`   Dates: Jan 22-24, 2026 (3 days)`);
      console.log(`   Status: APPROVED`);
      console.log(`   Reason: Family function\n`);

      // Update attendance records for tajagn's leave days to LEAVE status
      await prisma.attendance.updateMany({
        where: {
          employeeId: tajagn.id,
          date: {
            gte: new Date(2026, 0, 22),
            lte: new Date(2026, 0, 24)
          }
        },
        data: {
          status: 'LEAVE',
          checkIn: null,
          checkOut: null,
          workingHours: null
        }
      });

      leavesCreated++;
    }

    console.log(`✅ Created ${leavesCreated} approved leave requests\n`);

    // Summary
    console.log('═'.repeat(50));
    console.log('\n📊 SUMMARY:\n');
    console.log(`✅ Attendance Records: ${totalAttendanceCreated}`);
    console.log(`✅ Leave Requests: ${leavesCreated}`);
    console.log(`✅ Employees: ${allEmployees.length}`);
    console.log(`✅ Working Days: ${daysInJanuary - 4} (excluding Sundays)`);
    
    console.log('\n📈 Attendance Distribution (Approximate):');
    console.log('   - Present: ~75%');
    console.log('   - Late: ~10%');
    console.log('   - Half Day: ~7%');
    console.log('   - Absent: ~8%');

    console.log('\n🌴 Approved Leaves:');
    if (john) console.log(`   - ${john.fullName}: Jan 15-17 (SICK)`);
    if (tajagn) console.log(`   - ${tajagn.fullName}: Jan 22-24 (PAID)`);

    console.log('\n💡 Next Steps:');
    console.log('   1. View data: npx tsx show-data-summary.ts');
    console.log('   2. Run monthly aggregation from Admin Dashboard');
    console.log('   3. Check attendance trends chart');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedJanuaryData();
