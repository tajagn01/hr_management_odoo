import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

// Helper function to check if date is Sunday
function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

// Helper function to generate random time
function randomTime(baseHour: number, minuteRange: number): Date {
  const date = new Date();
  date.setHours(baseHour, Math.floor(Math.random() * minuteRange), 0, 0);
  return date;
}

// Helper function to calculate working hours
function calculateWorkingHours(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.round((diff / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal
}

async function seedAttendance() {
  console.log("🔄 Seeding Attendance Data (Jan 1 - Feb 7, 2026)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Step 1: Reset all attendance and leave data
    console.log("🗑️  Step 1: Clearing existing attendance and leave data...");
    await prisma.attendance.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.monthlyAttendance.deleteMany();
    console.log("✅ Cleared all attendance and leave records\n");

    // Step 2: Get all employees (exclude managers and admins)
    console.log("👥 Step 2: Fetching employees...");
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    // Filter out managers and admins
    const regularEmployees = employees.filter(
      (emp) => emp.user.role === "EMPLOYEE"
    );

    if (regularEmployees.length === 0) {
      console.log("❌ No regular employees found!");
      return;
    }

    console.log(`✅ Found ${regularEmployees.length} regular employees (managers excluded)\n`);

    // Step 3: Generate dates from Jan 1 to Feb 7, 2026 (excluding Sundays)
    console.log("📅 Step 3: Generating working days...");
    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-02-07");
    const workingDays: Date[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (!isSunday(d)) {
        workingDays.push(new Date(d));
      }
    }

    console.log(`✅ Generated ${workingDays.length} working days (excluding Sundays)\n`);

    // Step 4: Create random attendance for each employee
    console.log("📊 Step 4: Creating random attendance records...");
    
    const statusDistribution = {
      PRESENT: 75,  // 75% present
      HALF_DAY: 10, // 10% half day
      ABSENT: 10,   // 10% absent
      LEAVE: 5,     // 5% leave
    };

    let totalRecords = 0;
    const leaveRequests: any[] = [];

    for (const employee of regularEmployees) {
      console.log(`   Processing: ${employee.fullName} (${employee.employeeCode})`);
      
      let consecutiveLeaveDays: Date[] = [];
      
      for (const date of workingDays) {
        // Random status based on distribution
        const rand = Math.random() * 100;
        let status: "PRESENT" | "HALF_DAY" | "ABSENT" | "LEAVE";
        let checkIn: Date | null = null;
        let checkOut: Date | null = null;
        let workingHours: number | null = null;

        if (rand < statusDistribution.PRESENT) {
          status = "PRESENT";
          // Check-in: 8:30 AM - 10:00 AM (some late arrivals)
          checkIn = new Date(date);
          checkIn.setHours(8, 30 + Math.floor(Math.random() * 90), 0, 0);
          // Check-out: 5:00 PM - 6:30 PM
          checkOut = new Date(date);
          checkOut.setHours(17, Math.floor(Math.random() * 90), 0, 0);
          workingHours = calculateWorkingHours(checkIn, checkOut);
        } else if (rand < statusDistribution.PRESENT + statusDistribution.HALF_DAY) {
          status = "HALF_DAY";
          // Check-in: 8:30 AM - 9:30 AM
          checkIn = new Date(date);
          checkIn.setHours(8, 30 + Math.floor(Math.random() * 60), 0, 0);
          // Check-out: 12:00 PM - 2:00 PM (half day)
          checkOut = new Date(date);
          checkOut.setHours(12, Math.floor(Math.random() * 120), 0, 0);
          workingHours = calculateWorkingHours(checkIn, checkOut);
        } else if (rand < statusDistribution.PRESENT + statusDistribution.HALF_DAY + statusDistribution.ABSENT) {
          status = "ABSENT";
          // No check-in/out for absent
        } else {
          status = "LEAVE";
          consecutiveLeaveDays.push(new Date(date));
          // No check-in/out for leave
        }

        // Create attendance record
        await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            date: date,
            status: status,
            checkIn: checkIn,
            checkOut: checkOut,
            workingHours: workingHours,
          },
        });

        totalRecords++;
      }

      // Create leave requests for consecutive leave days
      if (consecutiveLeaveDays.length > 0) {
        // Group consecutive days
        const leaveGroups: Date[][] = [];
        let currentGroup: Date[] = [consecutiveLeaveDays[0]];

        for (let i = 1; i < consecutiveLeaveDays.length; i++) {
          const prevDate = consecutiveLeaveDays[i - 1];
          const currDate = consecutiveLeaveDays[i];
          const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

          if (dayDiff <= 1) {
            currentGroup.push(currDate);
          } else {
            leaveGroups.push(currentGroup);
            currentGroup = [currDate];
          }
        }
        leaveGroups.push(currentGroup);

        // Create leave request for each group
        for (const group of leaveGroups) {
          const leaveTypes = ["PAID", "SICK", "UNPAID"];
          const randomType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
          
          const leaveRequest = await prisma.leaveRequest.create({
            data: {
              employeeId: employee.id,
              type: randomType as "PAID" | "SICK" | "UNPAID",
              startDate: group[0],
              endDate: group[group.length - 1],
              days: group.length,
              reason: `${randomType} leave`,
              status: "APPROVED",
              approvedBy: (await prisma.user.findFirst({ where: { role: "ADMIN" } }))?.id,
              approvedAt: new Date(group[0].getTime() - 24 * 60 * 60 * 1000), // Approved 1 day before
            },
          });

          leaveRequests.push(leaveRequest);
        }
      }
    }

    console.log(`\n✅ Created ${totalRecords} attendance records`);
    console.log(`✅ Created ${leaveRequests.length} leave requests\n`);

    // Step 5: Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Summary:");
    console.log(`   Period: Jan 1 - Feb 7, 2026`);
    console.log(`   Working Days: ${workingDays.length} (Sundays excluded)`);
    console.log(`   Regular Employees: ${regularEmployees.length} (managers excluded)`);
    console.log(`   Total Attendance Records: ${totalRecords}`);
    console.log(`   Leave Requests: ${leaveRequests.length}`);
    console.log("\n📈 Status Distribution:");
    console.log(`   Present: ~${statusDistribution.PRESENT}% (includes some late arrivals)`);
    console.log(`   Half Day: ~${statusDistribution.HALF_DAY}%`);
    console.log(`   Absent: ~${statusDistribution.ABSENT}%`);
    console.log(`   Leave: ~${statusDistribution.LEAVE}%`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("✅ Attendance seeding completed successfully!\n");
  } catch (error) {
    console.error("❌ Error seeding attendance:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedAttendance()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedAttendance };
