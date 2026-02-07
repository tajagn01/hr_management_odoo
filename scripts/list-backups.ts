import fs from "fs";
import path from "path";

function listBackups() {
  console.log("📦 Available Database Backups");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const backupDir = path.join(__dirname, "../backups");

  if (!fs.existsSync(backupDir)) {
    console.log("❌ No backups directory found!");
    console.log("💡 Run 'npm run backup' to create your first backup.\n");
    return;
  }

  const backupFiles = fs
    .readdirSync(backupDir)
    .filter((file) => file.startsWith("backup-") && file.endsWith(".json"))
    .sort()
    .reverse();

  if (backupFiles.length === 0) {
    console.log("❌ No backup files found!");
    console.log("💡 Run 'npm run backup' to create your first backup.\n");
    return;
  }

  console.log(`Found ${backupFiles.length} backup(s):\n`);

  backupFiles.forEach((file, index) => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    const sizeInKB = (stats.size / 1024).toFixed(2);

    // Try to read metadata
    try {
      const backup = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const metadata = backup.metadata;

      console.log(`${index + 1}. ${file}`);
      console.log(`   📅 Created: ${new Date(metadata.timestamp).toLocaleString()}`);
      console.log(`   📊 Size: ${sizeInKB} KB`);
      console.log(`   📝 Records:`);
      console.log(`      • Users: ${metadata.recordCounts.users}`);
      console.log(`      • Employees: ${metadata.recordCounts.employees}`);
      console.log(`      • Attendance: ${metadata.recordCounts.attendance}`);
      console.log(`      • Leave Requests: ${metadata.recordCounts.leaveRequests}`);
      console.log(`      • Payroll: ${metadata.recordCounts.payroll}`);
      console.log(`      • Monthly Attendance: ${metadata.recordCounts.monthlyAttendance}`);
      console.log(`      • Notifications: ${metadata.recordCounts.notifications}`);
      console.log();
    } catch (error) {
      console.log(`${index + 1}. ${file}`);
      console.log(`   📅 Created: ${stats.mtime.toLocaleString()}`);
      console.log(`   📊 Size: ${sizeInKB} KB`);
      console.log(`   ⚠️  Could not read metadata\n`);
    }
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n💡 To restore a backup:");
  console.log("   npm run restore              (uses most recent backup)");
  console.log("   npm run restore <filename>   (uses specific backup)\n");
}

// Run if called directly
if (require.main === module) {
  listBackups();
}

export { listBackups };
