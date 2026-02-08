import { prisma } from "../lib/prisma";

async function main() {
    const employees = await prisma.employee.findMany({
        select: {
            fullName: true,
            profileCompleted: true
        }
    });

    console.log("Current employee status:");
    employees.forEach(emp => {
        console.log(`  ${emp.fullName}: ${emp.profileCompleted ? '✅ Completed' : '❌ Not completed'}`);
    });

    console.log("\nUpdating all to completed...");

    const result = await prisma.employee.updateMany({
        data: { profileCompleted: true }
    });

    console.log(`✅ Updated ${result.count} employees\n`);

    const updated = await prisma.employee.findMany({
        select: {
            fullName: true,
            profileCompleted: true
        }
    });

    console.log("After update:");
    updated.forEach(emp => {
        console.log(`  ${emp.fullName}: ${emp.profileCompleted ? '✅ Completed' : '❌ Not completed'}`);
    });
}

main()
    .catch(console.error)
    .finally(() => process.exit(0));
