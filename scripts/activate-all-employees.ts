import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function activateAllEmployees() {
  console.log("🔄 Activating All Employees");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    // Get all employees with incomplete profiles
    const incompleteEmployees = await prisma.employee.findMany({
      where: {
        profileCompleted: false,
      },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        profileCompleted: true,
      },
    });

    console.log(`Found ${incompleteEmployees.length} employees with incomplete profiles:\n`);

    if (incompleteEmployees.length === 0) {
      console.log("✅ All employees already have completed profiles!\n");
      return;
    }

    incompleteEmployees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.fullName} (${emp.employeeCode})`);
    });

    console.log("\n🔄 Updating all employees to active status...\n");

    // Update all employees to have profileCompleted = true
    const result = await prisma.employee.updateMany({
      where: {
        profileCompleted: false,
      },
      data: {
        profileCompleted: true,
      },
    });

    console.log(`✅ Updated ${result.count} employees to active status\n`);

    // Verify the update
    const allEmployees = await prisma.employee.findMany({
      select: {
        fullName: true,
        employeeCode: true,
        profileCompleted: true,
        user: {
          select: {
            role: true,
          },
        },
      },
      orderBy: {
        employeeCode: "asc",
      },
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 All Employees Status:\n");

    allEmployees.forEach((emp, index) => {
      const status = emp.profileCompleted ? "✅ Active" : "⚠️  Onboarding";
      const role = emp.user.role;
      console.log(`${index + 1}. ${emp.fullName} (${emp.employeeCode})`);
      console.log(`   Role: ${role}`);
      console.log(`   Status: ${status}\n`);
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ All employees are now active!\n");
  } catch (error) {
    console.error("❌ Error activating employees:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  activateAllEmployees()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { activateAllEmployees };
