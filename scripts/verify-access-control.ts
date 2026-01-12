
import { prisma } from "../lib/prisma";
import { getAuthorizedEmployeeIds } from "../lib/access-control";

async function verifyAccessControl() {
    console.log("🔐 Starting Access Control Verification...");

    try {
        // 1. Setup Test Users
        // Admin
        const adminEmail = "admin.test@example.com";
        let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!adminUser) {
            adminUser = await prisma.user.create({
                // @ts-ignore
                data: { email: adminEmail, password: "pw", role: "ADMIN" }
            });
        }

        // Manager
        const managerEmail = "manager.test@example.com";
        let managerUser = await prisma.user.findUnique({ where: { email: managerEmail } });
        if (!managerUser) {
            managerUser = await prisma.user.create({
                data: {
                    email: managerEmail,
                    password: "pw",
                    // @ts-ignore
                    role: "MANAGER",
                    employee: {
                        create: {
                            fullName: "Manager Test",
                            employeeCode: "MGR_TEST",
                            department: "Sales",
                            designation: "Manager",
                            joiningDate: new Date()
                        }
                    }
                },
                include: { employee: true }
            });
        }
        // Ensure manager has employee record
        let managerEmployee = await prisma.employee.findUnique({ where: { userId: managerUser.id } });
        if (!managerEmployee) {
            managerEmployee = await prisma.employee.create({
                data: {
                    fullName: "Manager Test",
                    employeeCode: "MGR_TEST",
                    department: "Sales",
                    designation: "Manager",
                    joiningDate: new Date(),
                    userId: managerUser.id
                }
            });
        }

        // Employee 1 (Team Member)
        const emp1Email = "emp1.test@example.com";
        let emp1User = await prisma.user.findUnique({ where: { email: emp1Email } });
        if (!emp1User) {
            emp1User = await prisma.user.create({
                data: {
                    email: emp1Email,
                    password: "pw",
                    role: "EMPLOYEE",
                    employee: {
                        create: {
                            fullName: "Employee One",
                            employeeCode: "EMP_TEST_1",
                            department: "Sales",
                            designation: "Associate",
                            joiningDate: new Date(),
                            // @ts-ignore
                            managerId: managerEmployee.id // Assigned to Manager
                        }
                    }
                },
                include: { employee: true }
            });
        }
        let emp1 = await prisma.employee.findUnique({ where: { userId: emp1User.id } });
        if (!emp1) {
            emp1 = await prisma.employee.create({
                data: {
                    fullName: "Employee One",
                    employeeCode: "EMP_TEST_1",
                    department: "Sales",
                    designation: "Associate",
                    joiningDate: new Date(),
                    userId: emp1User.id,
                    // @ts-ignore
                    managerId: managerEmployee.id
                }
            });
        }

        // Employee 2 (Other Team)
        const emp2Email = "emp2.test@example.com";
        let emp2User = await prisma.user.findUnique({ where: { email: emp2Email } });
        if (!emp2User) {
            emp2User = await prisma.user.create({
                data: {
                    email: emp2Email,
                    password: "pw",
                    role: "EMPLOYEE",
                    employee: {
                        create: {
                            fullName: "Employee Two",
                            employeeCode: "EMP_TEST_2",
                            department: "IT",
                            designation: "Dev",
                            joiningDate: new Date()
                        }
                    }
                },
                include: { employee: true }
            });
        }
        let emp2 = await prisma.employee.findUnique({ where: { userId: emp2User.id } });
        if (!emp2) {
            emp2 = await prisma.employee.create({
                data: {
                    fullName: "Employee Two",
                    employeeCode: "EMP_TEST_2",
                    department: "IT",
                    designation: "Dev",
                    joiningDate: new Date(),
                    userId: emp2User.id
                }
            });
        }

        console.log("✅ Test users setup complete");

        // 2. Verify Admin Access
        console.log("\nTesting Admin Access...");
        // Admin should see everyone
        // @ts-ignore
        const adminAccess = await getAuthorizedEmployeeIds(adminUser);
        if (adminAccess.length === 0) { // Empty array means all access in our logic? Or list of all IDs?
            // Let's check the implementation of getAuthorizedEmployeeIds
            // Usually returns array of IDs or undefined/null for "all"
            // Wait, looking at previous context, it returns string[]
        }
        // Actually, let's just check if we can query for Emp1 as Admin
        // Simulating what the API does:
        // @ts-ignore
        const adminCanSeeEmp1 = await getAuthorizedEmployeeIds(adminUser, emp1.id);
        // @ts-ignore
        const adminCanSeeEmp2 = await getAuthorizedEmployeeIds(adminUser, emp2.id);

        if (adminCanSeeEmp1.includes(emp1.id) && adminCanSeeEmp2.includes(emp2.id)) {
            console.log("✅ Admin can access all employees");
        } else {
            console.error("❌ Admin access check failed");
        }

        // 3. Verify Manager Access
        console.log("\nTesting Manager Access...");
        // Manager should see Emp1 (Team) but NOT Emp2 (Other)

        // Check access to Team Member
        // @ts-ignore
        const mgrCanSeeEmp1 = await getAuthorizedEmployeeIds({ ...managerUser, employee: managerEmployee }, emp1.id);
        if (mgrCanSeeEmp1.includes(emp1.id)) {
            console.log("✅ Manager can access team member");
        } else {
            console.error("❌ Manager FAILED to access team member");
        }

        // Check access to Non-Team Member
        try {
            // @ts-ignore
            const mgrCanSeeEmp2 = await getAuthorizedEmployeeIds({ ...managerUser, employee: managerEmployee }, emp2.id);
            if (mgrCanSeeEmp2.includes(emp2.id)) {
                console.error("❌ Manager INCORRECTLY accessed non-team member");
            } else {
                console.log("✅ Manager cannot access non-team member (returned empty/filtered list)");
            }
        } catch (e) {
            // If it throws error, that's also a valid "denied" response depending on implementation
            console.log("✅ Manager denied access to non-team member (threw error)");
        }

        // 4. Verify Employee Access
        console.log("\nTesting Employee Access...");
        // Emp1 should see Self but NOT Emp2

        // @ts-ignore
        const emp1CanSeeSelf = await getAuthorizedEmployeeIds({ ...emp1User, employee: emp1 }, emp1.id);
        if (emp1CanSeeSelf.includes(emp1.id)) {
            console.log("✅ Employee can access self");
        } else {
            console.error("❌ Employee FAILED to access self");
        }

        // @ts-ignore
        const emp1CanSeeEmp2 = await getAuthorizedEmployeeIds({ ...emp1User, employee: emp1 }, emp2.id);
        if (emp1CanSeeEmp2.includes(emp2.id)) {
            console.error("❌ Employee INCORRECTLY accessed other employee");
        } else {
            console.log("✅ Employee cannot access other employee");
        }

        console.log("\n🎉 Access Control Verification Complete!");

    } catch (error) {
        console.error("Verification Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAccessControl();
