import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function showUsers() {
  console.log("👥 All Registered Users");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const users = await prisma.user.findMany({
      include: {
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
            department: true,
            designation: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (users.length === 0) {
      console.log("❌ No users found in database\n");
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.employee?.fullName || "No Profile"}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Role: ${user.role}`);
      console.log(`   ✅ Active: ${user.isActive ? "Yes" : "No"}`);
      console.log(`   📨 Email Verified: ${user.emailVerified ? "Yes" : "No"}`);
      
      if (user.employee) {
        console.log(`   👤 Employee Code: ${user.employee.employeeCode}`);
        console.log(`   🏢 Department: ${user.employee.department}`);
        console.log(`   💼 Designation: ${user.employee.designation}`);
      } else {
        console.log(`   ⚠️  No employee profile (Google login user without profile)`);
      }
      
      console.log(`   📅 Joined: ${user.createdAt.toLocaleString()}`);
      console.log();
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n💡 To view in browser:");
    console.log("   1. Login as admin: admin@dayflow.com / admin123");
    console.log("   2. Go to: http://localhost:3000/admin/users");
    console.log("\n💡 Google login users will show here when they sign in\n");
  } catch (error) {
    console.error("❌ Error fetching users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  showUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { showUsers };
