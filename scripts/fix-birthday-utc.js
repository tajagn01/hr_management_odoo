const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixBirthday() {
    try {
        console.log("🔍 Finding Raj Tgarala...");

        const employee = await prisma.employee.findFirst({
            where: {
                user: {
                    email: "trgarala@gmail.com"
                }
            },
            include: { user: true }
        });

        if (employee) {
            // Create date in UTC to avoid timezone issues
            // We want Jan 24 in the database, so create it as UTC
            const birthday = new Date(Date.UTC(2000, 0, 24)); // Jan 24, 2000 UTC

            const updated = await prisma.employee.update({
                where: { id: employee.id },
                data: { dateOfBirth: birthday }
            });

            console.log("✅ Updated birthday to:", updated.dateOfBirth);
            console.log("📅 This should match: January 24");

            // Verify the date
            const stored = new Date(updated.dateOfBirth);
            console.log("Month (1-based):", stored.getUTCMonth() + 1);
            console.log("Day:", stored.getUTCDate());
        } else {
            console.log("❌ Employee not found");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixBirthday();
