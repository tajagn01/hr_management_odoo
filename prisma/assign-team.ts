import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assignTeam() {
    console.log("🔧 Assigning team members to Sarah Manager...");

    try {
        // 1. Find manager user
        const managerUser = await prisma.user.findUnique({
            where: { email: "manager@dayflow.com" },
        });

        if (!managerUser) {
            console.error("❌ Manager user not found! Please run 'add-manager.ts' first.");
            return;
        }

        // 2. Find manager employee profile
        const managerEmployee = await prisma.employee.findFirst({
            where: { userId: managerUser.id },
        });

        if (!managerEmployee) {
            console.error("❌ Manager employee profile not found!");
            return;
        }

        console.log(`✅ Found Manager: ${managerEmployee.fullName} (${managerEmployee.id})`);

        // 3. Find all potential team members (everyone except the manager)
        // We exclude the manager themselves
        const teamMembers = await prisma.employee.findMany({
            where: {
                id: { not: managerEmployee.id }
            }
        });

        console.log(`👥 Found ${teamMembers.length} employees to assign.`);

        // 4. Update them
        const result = await prisma.employee.updateMany({
            where: {
                id: { in: teamMembers.map(e => e.id) }
            },
            data: {
                managerId: managerEmployee.id
            }
        });

        console.log(`✅ Successfully assigned ${result.count} employees to Sarah Manager's team.`);

        // Log names for verification
        teamMembers.forEach(emp => {
            console.log(`   - Assigned: ${emp.fullName} (${emp.designation})`);
        });

    } catch (error: any) {
        console.error("❌ Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

assignTeam();
