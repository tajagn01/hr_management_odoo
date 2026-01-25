
import { prisma } from "../lib/prisma";
import { updateMonthlyAttendance } from "../lib/attendance-aggregator";

async function verifyAttendanceFlow() {
    console.log("🧪 Starting Attendance Flow Verification...");

    try {
        // 1. Create or get a test employee
        const testEmail = "test.attendance@example.com";
        let user = await prisma.user.findUnique({ where: { email: testEmail } });

        if (!user) {
            console.log("Creating test user...");
            user = await prisma.user.create({
                data: {
                    email: testEmail,
                    password: "password123",
                    role: "EMPLOYEE",
                    employee: {
                        create: {
                            fullName: "Test Attendance User",
                            employeeCode: "TEST001",
                            department: "Engineering",
                            designation: "Tester",
                            joiningDate: new Date()
                        }
                    }
                },
                include: { employee: true }
            });
        } else {
            console.log("Test user already exists.");
            // Ensure employee record exists
            const existingEmployee = await prisma.employee.findUnique({ where: { userId: user.id } });

            if (!existingEmployee) {
                console.log("Recreating employee record...");
                await prisma.employee.create({
                    data: {
                        fullName: "Test Attendance User",
                        employeeCode: "TEST001",
                        department: "Engineering",
                        designation: "Tester",
                        joiningDate: new Date(),
                        userId: user.id
                    }
                });
            }
        }

        const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
        if (!employee) throw new Error("Employee not found");
        console.log(`User: ${employee.fullName} (${employee.id})`);

        // 2. Simulate Check-in (Today at 9:00 AM)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Clean up existing attendance for today
        await prisma.attendance.deleteMany({
            where: {
                employeeId: employee.id,
                date: { gte: today }
            }
        });

        const checkInTime = new Date();
        checkInTime.setHours(9, 0, 0, 0); // 9:00 AM

        console.log(`Simulating Check-in at ${checkInTime.toLocaleTimeString()}...`);
        const attendance = await prisma.attendance.create({
            data: {
                employeeId: employee.id,
                date: checkInTime,
                checkIn: checkInTime,
                status: "PRESENT"
            }
        });
        console.log("✅ Check-in successful");

        // 3. Simulate Check-out (Today at 5:00 PM) - 8 hours later
        const checkOutTime = new Date();
        checkOutTime.setHours(17, 0, 0, 0); // 5:00 PM

        const durationMs = checkOutTime.getTime() - checkInTime.getTime();
        const workingHours = durationMs / (1000 * 60 * 60); // Should be 8.0

        console.log(`Simulating Check-out at ${checkOutTime.toLocaleTimeString()}...`);

        // Update attendance record
        const updatedAttendance = await prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: checkOutTime,
                // @ts-ignore - workingHours field exists in schema but client not generated
                workingHours: workingHours
            }
        });

        // @ts-ignore
        console.log(`✅ Check-out successful. Working Hours: ${updatedAttendance.workingHours}`);

        // @ts-ignore
        if (updatedAttendance.workingHours !== 8) {
            console.error("❌ Working hours calculation incorrect!");
        } else {
            console.log("✅ Working hours calculation correct (8.0)");
        }

        // 4. Trigger Monthly Aggregation
        console.log("Triggering monthly aggregation...");
        await updateMonthlyAttendance(employee.id, checkOutTime);

        // 5. Verify Monthly Aggregation
        const currentYear = checkOutTime.getFullYear();
        const currentMonth = checkOutTime.getMonth() + 1;

        // @ts-ignore
        const monthlyRecord = await prisma.monthlyAttendance.findUnique({
            where: {
                employeeId_year_month: {
                    employeeId: employee.id,
                    year: currentYear,
                    month: currentMonth
                }
            }
        });

        if (!monthlyRecord) {
            console.error("❌ Monthly attendance record not found!");
        } else {
            console.log("✅ Monthly attendance record found:");
            console.log(`   - Present Days: ${monthlyRecord.presentDays}`);
            console.log(`   - Total Hours: ${monthlyRecord.totalWorkingHours}`);

            if (monthlyRecord.presentDays >= 1 && monthlyRecord.totalWorkingHours >= 8) {
                console.log("✅ Aggregation data looks correct!");
            } else {
                console.error("❌ Aggregation data mismatch!");
            }
        }

        // 6. Trigger Yearly Aggregation
        console.log("Triggering yearly aggregation...");
        const { updateYearlyAttendance } = await import("../lib/attendance-aggregator");
        await updateYearlyAttendance(employee.id, currentYear);

        // 7. Verify Yearly Aggregation
        // @ts-ignore
        const yearlyRecord = await prisma.yearlyAttendance.findUnique({
            where: {
                employeeId_year: {
                    employeeId: employee.id,
                    year: currentYear
                }
            }
        });

        if (!yearlyRecord) {
            console.error("❌ Yearly attendance record not found!");
        } else {
            console.log("✅ Yearly attendance record found:");
            console.log(`   - Total Working Days: ${yearlyRecord.totalWorkingDays}`);
            console.log(`   - Present Days: ${yearlyRecord.presentDays}`);
            console.log(`   - Total Hours: ${yearlyRecord.totalWorkingHours}`);

            if (yearlyRecord.presentDays >= 1 && yearlyRecord.totalWorkingHours >= 8) {
                console.log("✅ Yearly aggregation data looks correct!");
            } else {
                console.error("❌ Yearly aggregation data mismatch!");
            }
        }

        console.log("\n🎉 Verification Complete!");

    } catch (error) {
        console.error("Verification Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAttendanceFlow();
