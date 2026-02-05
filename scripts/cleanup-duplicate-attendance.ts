import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Clean up duplicate attendance records
 * Keep only the first record for each employee per day
 */
async function cleanupDuplicates() {
    console.log("🧹 Cleaning up duplicate attendance records...\n");

    try {
        const dates = [1, 3, 4, 5]; // Feb dates
        let totalDeleted = 0;

        for (const date of dates) {
            const dayStart = new Date(Date.UTC(2026, 1, date, 0, 0, 0, 0));
            const dayEnd = new Date(Date.UTC(2026, 1, date, 23, 59, 59, 999));

            console.log(`\n📅 Processing Feb ${date}, 2026...`);

            // Get all records for this day
            const records = await prisma.attendance.findMany({
                where: {
                    date: {
                        gte: dayStart,
                        lte: dayEnd
                    }
                },
                include: {
                    employee: { select: { fullName: true } }
                },
                orderBy: { createdAt: 'asc' } // Keep the first created
            });

            // Group by employee
            const employeeMap = new Map<string, any[]>();
            records.forEach(record => {
                if (!employeeMap.has(record.employeeId)) {
                    employeeMap.set(record.employeeId, []);
                }
                employeeMap.get(record.employeeId)!.push(record);
            });

            // Find and delete duplicates
            let dayDeleted = 0;
            for (const [employeeId, empRecords] of employeeMap.entries()) {
                if (empRecords.length > 1) {
                    // Keep the first, delete the rest
                    const toDelete = empRecords.slice(1);
                    const empName = empRecords[0].employee.fullName;

                    console.log(`   🔄 ${empName}: Found ${empRecords.length} records, deleting ${toDelete.length} duplicates`);

                    for (const record of toDelete) {
                        await prisma.attendance.delete({
                            where: { id: record.id }
                        });
                        dayDeleted++;
                    }
                }
            }

            totalDeleted += dayDeleted;
            const remaining = employeeMap.size;
            console.log(`   ✅ Cleaned up ${dayDeleted} duplicates. ${remaining} unique employees remain.`);
        }

        console.log(`\n✅ Total duplicates deleted: ${totalDeleted}`);

        // Show final summary
        console.log("\n📊 Final Summary:");
        for (const date of dates) {
            const dayStart = new Date(Date.UTC(2026, 1, date, 0, 0, 0, 0));
            const dayEnd = new Date(Date.UTC(2026, 1, date, 23, 59, 59, 999));

            const records = await prisma.attendance.findMany({
                where: { date: { gte: dayStart, lte: dayEnd } }
            });

            const present = records.filter(r => r.status === 'PRESENT').length;
            const late = records.filter(r => r.status === 'LATE').length;
            const absent = records.filter(r => r.status === 'ABSENT').length;

            console.log(`   Feb ${date}: Total ${records.length} | ✅ ${present} | ⏰ ${late} | ❌ ${absent}`);
        }

    } catch (error: any) {
        console.error("❌ Error:", error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

cleanupDuplicates();
