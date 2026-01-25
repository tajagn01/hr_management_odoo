import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    console.log("🌱 Seeding test managers...");

    const password = await bcrypt.hash("password123", 10);

    const managers = [
        {
            email: "manager.one@example.com",
            name: "Alice Manager",
            department: "IT",
            designation: "Head of Engineering",
        },
        {
            email: "manager.two@example.com",
            name: "Bob Manager",
            department: "Marketing",
            designation: "Marketing Director",
        },
    ];

    for (const mgr of managers) {
        const existingUser = await prisma.user.findUnique({
            where: { email: mgr.email },
        });

        if (!existingUser) {

            // Count employees for code
            const count = await prisma.employee.count();
            const code = `EMP${String(count + 1).padStart(4, "0")}`;

            await prisma.user.create({
                data: {
                    email: mgr.email,
                    password,
                    role: "MANAGER",
                    isActive: true,
                    emailVerified: true,
                    employee: {
                        create: {
                            employeeCode: code,
                            fullName: mgr.name,
                            department: mgr.department,
                            designation: mgr.designation,
                            joiningDate: new Date(),
                            profileCompleted: true,
                        },
                    },
                },
            });
            console.log(`✅ Created manager: ${mgr.name} (${mgr.email})`);
        } else {
            console.log(`⚠️ Manager ${mgr.email} already exists.`);
        }
    }

    console.log("🌱 Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
