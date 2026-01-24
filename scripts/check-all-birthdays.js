const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAllBirthdays() {
    const employees = await prisma.employee.findMany({
        where: { user: { isActive: true } },
        include: { user: { select: { email: true } } }
    });

    console.log("\n🔍 ALL EMPLOYEE BIRTHDAYS:\n");

    employees.forEach(emp => {
        if (emp.dateOfBirth) {
            const bd = new Date(emp.dateOfBirth);
            console.log(`👤 ${emp.fullName} (${emp.user.email})`);
            console.log(`   Birthday: ${bd.toISOString()}`);
            console.log(`   Month/Day (UTC): ${bd.getUTCMonth() + 1}/${bd.getUTCDate()}`);
            console.log(`   Month/Day (Local): ${bd.getMonth() + 1}/${bd.getDate()}`);
            console.log("");
        }
    });

    await prisma.$disconnect();
}

checkAllBirthdays();
