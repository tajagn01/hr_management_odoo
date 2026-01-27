import { prisma } from './lib/prisma';
import { calculateAttendanceStatus } from './lib/attendance-service';

async function test() {
    console.log('Fetching first employee...');
    const employee = await prisma.employee.findFirst();

    if (!employee) {
        console.log('No employees found!');
        return;
    }

    console.log('Found employee:', employee.id, employee.fullName);

    // Test direct calculation
    const today = new Date();
    console.log('Calculating status for date:', today);
    const status = await calculateAttendanceStatus(employee.id, today);
    console.log('Direct status calculation:', status);

    console.log('Done.');
}

test()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
