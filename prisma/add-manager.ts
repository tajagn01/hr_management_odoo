import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function addManager() {
    console.log("🔧 Adding MANAGER user...");

    try {
        // Create manager user
        const managerPassword = await bcrypt.hash("manager123", 10);
        const manager = await prisma.user.create({
            data: {
                email: "manager@dayflow.com",
                password: managerPassword,
                role: "MANAGER",
                isActive: true,
                emailVerified: true,
            },
        });

        console.log("✅ Created manager user: manager@dayflow.com");

        // Create manager employee profile
        const managerEmployee = await prisma.employee.create({
            data: {
                userId: manager.id,
                employeeCode: "MGR001",
                fullName: "Sarah Manager",
                phone: "+1234567899",
                address: "999 Manager St, Los Angeles, CA 90001",
                designation: "Engineering Manager",
                department: "IT",
                joiningDate: new Date("2022-06-01"),
            },
        });

        console.log("✅ Created manager employee profile");

        // Find John Doe to assign to manager
        const john = await prisma.employee.findFirst({
            where: { employeeCode: "EMP001" },
        });

        if (john) {
            await prisma.employee.update({
                where: { id: john.id },
                data: { managerId: managerEmployee.id },
            });
            console.log("✅ Assigned John Doe to Sarah's team");
        }

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("✅ Manager user created successfully!");
        console.log("\n📧 MANAGER LOGIN:");
        console.log("  Email: manager@dayflow.com");
        console.log("  Password: manager123");
        console.log("\n👥 Team Members:");
        console.log("  - John Doe (Senior Developer)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    } catch (error: any) {
        if (error.code === "P2002") {
            console.log("⚠️  Manager user already exists!");
        } else {
            console.error("❌ Error:", error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

addManager();
