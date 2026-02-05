import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function showFebruaryData() {
    console.log("📊 February 2026 Attendance Report\n");
    console.log("=".repeat(80));

    try {
        // Get all employees
        const employees = await prisma.employee.findMany({
            select: { id: true, fullName: true }
        });

        console.log(`\n👥 Total Employees: ${employees.length}\n`);

        // February dates (excluding Sunday Feb 2)
        const dates = [
            { date: 1, day: "Saturday" },
            { date: 3, day: "Monday" },
            { date: 4, day: "Tuesday" },
            { date: 5, day: "Wednesday" },
        ];

        for (const { date, day } of dates) {
            const dayStart = new Date(Date.UTC(2026, 1, date, 0, 0, 0, 0));
            const dayEnd = new Date(Date.UTC(2026, 1, date, 23, 59, 59, 999));

            const records = await prisma.attendance.findMany({
                where: {
                    date: {
                        gte: dayStart,
                        lte: dayEnd
                    }
                },
                include: {
                    employee: {
                        select: { fullName: true }
                    }
                },
                orderBy: {
                    employee: { fullName: 'asc' }
                }
            });

            const present = records.filter(r => r.status === 'PRESENT');
            const late = records.filter(r => r.status === 'LATE');
            const absent = records.filter(r => r.status === 'ABSENT');

            console.log(`\n📅 February ${date}, 2026 (${day})`);
            console.log("-".repeat(80));
            console.log(`Total: ${records.length} | ✅ Present: ${present.length} | ⏰ Late: ${late.length} | ❌ Absent: ${absent.length}\n`);

            // Show each employee
            records.forEach(r => {
                const emoji = r.status === 'PRESENT' ? '✅' : r.status === 'LATE' ? '⏰' : '❌';
                let timeStr = '';

                if (r.checkIn) {
                    // Convert UTC to IST for display
                    const checkInIST = new Date(r.checkIn);
                    const checkInTime = checkInIST.toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    const checkOutTime = r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'N/A';

                    timeStr = ` (In: ${checkInTime}, Out: ${checkOutTime}, Hours: ${r.workingHours || 0})`;
                }

                console.log(`   ${emoji} ${r.employee.fullName.padEnd(25)} ${r.status}${timeStr}`);
            });
        }

        console.log("\n" + "=".repeat(80));
        console.log("\n💡 Note: Times shown are in IST (Indian Standard Time)\n");

    } catch (error: any) {
        console.error("❌ Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

showFebruaryData();
