import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assignTeamToManager() {
    console.log("👥 Assigning all employees to manager...");

    try {
        // Find the manager employee
        const manager = await prisma.employee.findFirst({
            where: { employeeCode: "MGR001" },
        });

        if (!manager) {
            console.error("❌ Manager not found! Please run add-manager.ts first.");
            return;
        }

        console.log(`✅ Found manager: ${manager.fullName}`);

        // Get all employees except the manager
        const allEmployees = await prisma.employee.findMany({
            where: {
                employeeCode: {
                    not: "MGR001", // Exclude the manager themselves
                },
            },
        });

        console.log(`📋 Found ${allEmployees.length} employees to assign`);

        // Update all employees to be managed by this manager
        const updatePromises = allEmployees.map((emp) =>
            prisma.employee.update({
                where: { id: emp.id },
                // @ts-ignore
                data: { managerId: manager.id },
            })
        );

        await Promise.all(updatePromises);

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("✅ Successfully assigned all employees to manager!");
        console.log("\n👔 Manager: Sarah Manager (manager@dayflow.com)");
        console.log("\n👥 Team Members:");
        allEmployees.forEach((emp, index) => {
            console.log(`  ${index + 1}. ${emp.fullName} (${emp.employeeCode}) - ${emp.designation}`);
        });
        console.log(`\n📊 Total Team Size: ${allEmployees.length} employees`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    } catch (error: any) {
        console.error("❌ Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

assignTeamToManager();
