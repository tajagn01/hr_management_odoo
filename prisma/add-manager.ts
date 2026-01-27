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

        console.log("✅ Created manager employee profile");

        // Create SECOND manager user
        const directorPassword = await bcrypt.hash("director123", 10);
        const director = await prisma.user.create({
            data: {
                email: "director@dayflow.com",
                password: directorPassword,
                role: "MANAGER",
                isActive: true,
                emailVerified: true,
            },
        });

        // Create second manager profile
        await prisma.employee.create({
            data: {
                userId: director.id,
                employeeCode: "MGR002",
                fullName: "Michael Scott",
                phone: "+1234567898",
                address: "1725 Slough Avenue, Scranton, PA 18503",
                designation: "Regional Manager",
                department: "Sales",
                joiningDate: new Date("2010-01-01"),
            },
        });

        console.log("✅ Created second manager: Michael Scott");

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
        console.log("✅ Manager users created successfully!");
        console.log("\n📧 MANAGER 1 LOGIN:");
        console.log("  Email: manager@dayflow.com");
        console.log("  Password: manager123");
        console.log("\n📧 MANAGER 2 LOGIN:");
        console.log("  Email: director@dayflow.com");
        console.log("  Password: director123");
        console.log("\n👥 Team Members:");
        console.log("  - John Doe (Senior Developer) -> Assigned to Sarah");
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
