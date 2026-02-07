import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load environment variables
config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function backupDatabase() {
  console.log("🔄 Starting database backup...");

  try {
    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate timestamp for backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    console.log("📦 Fetching all data from database...");

    // Fetch all data from all tables
    const [
      users,
      employees,
      attendance,
      leaveRequests,
      payroll,
      monthlyAttendance,
      notifications,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.employee.findMany(),
      prisma.attendance.findMany(),
      prisma.leaveRequest.findMany(),
      prisma.payroll.findMany(),
      prisma.monthlyAttendance.findMany(),
      prisma.notification.findMany(),
    ]);

    // Create backup object
    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0",
        recordCounts: {
          users: users.length,
          employees: employees.length,
          attendance: attendance.length,
          leaveRequests: leaveRequests.length,
          payroll: payroll.length,
          monthlyAttendance: monthlyAttendance.length,
          notifications: notifications.length,
        },
      },
      data: {
        users,
        employees,
        attendance,
        leaveRequests,
        payroll,
        monthlyAttendance,
        notifications,
      },
    };

    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log("\n✅ Backup completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📁 Backup file: ${backupFile}`);
    console.log("\n📊 Backup Summary:");
    console.log(`   Users: ${users.length}`);
    console.log(`   Employees: ${employees.length}`);
    console.log(`   Attendance Records: ${attendance.length}`);
    console.log(`   Leave Requests: ${leaveRequests.length}`);
    console.log(`   Payroll Records: ${payroll.length}`);
    console.log(`   Monthly Attendance: ${monthlyAttendance.length}`);
    console.log(`   Notifications: ${notifications.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return backupFile;
  } catch (error) {
    console.error("❌ Backup failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if called directly
if (require.main === module) {
  backupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { backupDatabase };
