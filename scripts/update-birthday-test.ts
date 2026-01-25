import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateBirthday() {
    try {
        console.log("🔍 Looking for employee with email: trgarala@gmail.com");

        // Find employee with this email
        const employee = await prisma.employee.findFirst({
            where: {
                user: {
                    email: "trgarala@gmail.com"
                }
            },
            include: {
                user: true
            }
        });

        if (!employee) {
            console.log("❌ Employee not found. Creating new employee...");

            // Create user first
            const bcrypt = require("bcryptjs");
            const hashedPassword = await bcrypt.hash("employee123", 10);

            const user = await prisma.user.create({
                data: {
                    email: "trgarala@gmail.com",
                    password: hashedPassword,
                    role: "EMPLOYEE",
                    isActive: true,
                    emailVerified: true
                }
            });

            // Create employee
            const newEmployee = await prisma.employee.create({
                data: {
                    userId: user.id,
                    employeeCode: "TEST001",
                    fullName: "Raj Tgarala",
                    phone: "+91234567890",
                    address: "Test Address",
                    designation: "Test Employee",
                    department: "IT",
                    joiningDate: new Date(),
                    dateOfBirth: new Date(2000, 0, 24), // January 24, 2000
                    profileCompleted: true
                }
            });

            console.log("✅ Created new employee:", newEmployee.fullName);
            console.log("📧 Email:", user.email);
            console.log("🎂 Birthday:", newEmployee.dateOfBirth);
        } else {
            console.log("✅ Found employee:", employee.fullName);

            // Update birthday to January 24
            const updatedEmployee = await prisma.employee.update({
                where: { id: employee.id },
                data: {
                    dateOfBirth: new Date(2000, 0, 24), // January 24, 2000
                    fullName: "Raj Tgarala" // Update name too
                }
            });

            console.log("✅ Updated employee birthday");
            console.log("👤 Name:", updatedEmployee.fullName);
            console.log("📧 Email:", employee.user.email);
            console.log("🎂 Birthday:", updatedEmployee.dateOfBirth);
        }

        console.log("\n🎉 Now you can test the birthday email by running:");
        console.log("curl -X POST http://localhost:3000/api/cron/birthday");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

updateBirthday();
