import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assignManagers() {
    console.log("🔄 Starting manager assignment...");

    try {
        // 1. Fetch Managers
        const managers = await prisma.employee.findMany({
            where: {
                user: {
                    role: "MANAGER"
                }
            }
        });

        if (managers.length < 2) {
            console.error("❌ Not enough managers found! Make sure you ran 'npx tsx prisma/add-manager.ts' first.");
            return;
        }

        const manager1 = managers[0];
        const manager2 = managers[1];

        console.log(`👨‍💼 Manager 1: ${manager1.fullName} (${manager1.employeeCode})`);
        console.log(`👨‍💼 Manager 2: ${manager2.fullName} (${manager2.employeeCode})`);

        // 2. Fetch Employees (who are NOT managers)
        // We filter out anyone who is already in the managers list
        const employees = await prisma.employee.findMany({
            where: {
                id: {
                    notIn: managers.map(m => m.id)
                },
                user: {
                    role: "EMPLOYEE"
                }
            }
        });

        console.log(`👥 Found ${employees.length} employees to assign.`);

        // 3. Distribute Employees
        const midPoint = Math.ceil(employees.length / 2);
        const group1 = employees.slice(0, midPoint);
        const group2 = employees.slice(midPoint);

        // 4. Update Group 1
        console.log(`🔹 Assigning ${group1.length} employees to ${manager1.fullName}...`);
        for (const emp of group1) {
            await prisma.employee.update({
                where: { id: emp.id },
                data: { managerId: manager1.id }
            });
            console.log(`   - ${emp.fullName} -> ${manager1.fullName}`);
        }

        // 5. Update Group 2
        console.log(`🔹 Assigning ${group2.length} employees to ${manager2.fullName}...`);
        for (const emp of group2) {
            await prisma.employee.update({
                where: { id: emp.id },
                data: { managerId: manager2.id }
            });
            console.log(`   - ${emp.fullName} -> ${manager2.fullName}`);
        }

        console.log("\n✅ Manager assignment completed successfully!");

    } catch (error) {
        console.error("❌ Error assigning managers:", error);
    } finally {
        await prisma.$disconnect();
    }
}

assignManagers();
