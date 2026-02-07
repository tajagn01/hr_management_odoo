import { execSync } from "child_process";
import { backupDatabase } from "./backup-database";

/**
 * Safe migration script that creates a backup before running migrations
 */
async function safeMigrate() {
  console.log("🛡️  Safe Migration Process");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Step 1: Create backup
    console.log("Step 1: Creating backup before migration...\n");
    const backupFile = await backupDatabase();
    console.log(`✅ Backup created: ${backupFile}\n`);

    // Step 2: Run migration
    console.log("Step 2: Running database migration...\n");
    
    const migrationName = process.argv[2];
    if (!migrationName) {
      console.log("⚠️  No migration name provided. Running without name...");
      execSync("npx prisma migrate dev", { stdio: "inherit" });
    } else {
      console.log(`📝 Migration name: ${migrationName}`);
      execSync(`npx prisma migrate dev --name ${migrationName}`, {
        stdio: "inherit",
      });
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`💾 Backup saved at: ${backupFile}`);
    console.log("💡 If something went wrong, restore with:");
    console.log(`   npm run restore ${backupFile}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("\n❌ Migration failed!");
    console.error(error);
    console.log("\n💡 Your data is safe. Restore from backup if needed:");
    console.log("   npm run restore");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  safeMigrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { safeMigrate };
