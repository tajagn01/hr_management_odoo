import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load environment variables
config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function restoreDatabase(backupFilePath?: string) {
  console.log("🔄 Starting database restore...");

  try {
    // If no backup file specified, use the most recent one
    if (!backupFilePath) {
      const backupDir = path.join(__dirname, "../backups");
      if (!fs.existsSync(backupDir)) {
        throw new Error("No backups directory found!");
      }

      const backupFiles = fs
        .readdirSync(backupDir)
        .filter((file) => file.startsWith("backup-") && file.endsWith(".json"))
        .sort()
        .reverse();

      if (backupFiles.length === 0) {
        throw new Error("No backup files found!");
      }

      backupFilePath = path.join(backupDir, backupFiles[0]);
      console.log(`📁 Using most recent backup: ${backupFiles[0]}`);
    }

    // Read backup file
    console.log("📖 Reading backup file...");
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, "utf-8"));

    console.log("\n📊 Backup Information:");
    console.log(`   Created: ${backupData.metadata.timestamp}`);
    console.log(`   Version: ${backupData.metadata.version}`);
    console.log("\n⚠️  WARNING: This will DELETE all existing data!");
    console.log("   Press Ctrl+C within 5 seconds to cancel...\n");

    // Wait 5 seconds before proceeding
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("🗑️  Clearing existing data...");

    // Delete all existing data in correct order (respecting foreign keys)
    await prisma.notification.deleteMany();
    await prisma.monthlyAttendance.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    console.log("✅ Existing data cleared");

    console.log("\n📥 Restoring data...");

    // Restore users first (no dependencies)
    console.log("   Restoring users...");
    for (const user of backupData.data.users) {
      await prisma.user.create({ data: user });
    }

    // Restore employees (depends on users)
    console.log("   Restoring employees...");
    for (const employee of backupData.data.employees) {
      await prisma.employee.create({ data: employee });
    }

    // Restore payroll (depends on employees)
    console.log("   Restoring payroll...");
    for (const payroll of backupData.data.payroll) {
      await prisma.payroll.create({ data: payroll });
    }

    // Restore attendance (depends on employees)
    console.log("   Restoring attendance...");
    for (const attendance of backupData.data.attendance) {
      await prisma.attendance.create({
        data: {
          ...attendance,
          date: new Date(attendance.date),
          checkIn: attendance.checkIn ? new Date(attendance.checkIn) : null,
          checkOut: attendance.checkOut ? new Date(attendance.checkOut) : null,
        },
      });
    }

    // Restore leave requests (depends on employees and users)
    console.log("   Restoring leave requests...");
    for (const leave of backupData.data.leaveRequests) {
      await prisma.leaveRequest.create({
        data: {
          ...leave,
          startDate: new Date(leave.startDate),
          endDate: new Date(leave.endDate),
          approvedAt: leave.approvedAt ? new Date(leave.approvedAt) : null,
        },
      });
    }

    // Restore monthly attendance (depends on employees)
    console.log("   Restoring monthly attendance...");
    for (const monthly of backupData.data.monthlyAttendance) {
      await prisma.monthlyAttendance.create({ data: monthly });
    }

    // Restore notifications (depends on users)
    console.log("   Restoring notifications...");
    for (const notification of backupData.data.notifications) {
      await prisma.notification.create({
        data: {
          ...notification,
          createdAt: new Date(notification.createdAt),
          readAt: notification.readAt ? new Date(notification.readAt) : null,
        },
      });
    }

    console.log("\n✅ Database restore completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Restored Records:");
    console.log(`   Users: ${backupData.data.users.length}`);
    console.log(`   Employees: ${backupData.data.employees.length}`);
    console.log(`   Attendance Records: ${backupData.data.attendance.length}`);
    console.log(`   Leave Requests: ${backupData.data.leaveRequests.length}`);
    console.log(`   Payroll Records: ${backupData.data.payroll.length}`);
    console.log(`   Monthly Attendance: ${backupData.data.monthlyAttendance.length}`);
    console.log(`   Notifications: ${backupData.data.notifications.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Restore failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run restore if called directly
if (require.main === module) {
  const backupFile = process.argv[2]; // Optional: specify backup file path
  restoreDatabase(backupFile)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { restoreDatabase };
