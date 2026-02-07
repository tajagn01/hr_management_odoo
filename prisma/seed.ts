import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import path from "path";

// Load environment variables from parent directory
config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (optional)
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleared existing data");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@dayflow.com",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
      emailVerified: true, // Pre-verified for seed data
    },
  });

  console.log("👨‍💼 Created admin user: admin@dayflow.com");

  // Create employee users
  const employeePassword = await bcrypt.hash("employee123", 10);

  const johnUser = await prisma.user.create({
    data: {
      email: "john@dayflow.com",
      password: employeePassword,
      role: "EMPLOYEE",
      isActive: true,
      emailVerified: true, // Pre-verified for seed data
    },
  });

  const janeUser = await prisma.user.create({
    data: {
      email: "jane@dayflow.com",
      password: employeePassword,
      role: "EMPLOYEE",
      isActive: true,
      emailVerified: true, // Pre-verified for seed data
    },
  });

  // Create 5 additional employees
  const employees = [
    {
      email: "alice@dayflow.com",
      name: "Alice Johnson",
      code: "EMP003",
      phone: "+1234567892",
      address: "789 Pine Rd, Boston, MA 02101",
      designation: "Product Manager",
      department: "Product",
      joining: new Date("2023-03-10"),
      role: "MANAGER",
    },
    {
      email: "bob@dayflow.com",
      name: "Bob Wilson",
      code: "EMP004",
      phone: "+1234567893",
      address: "321 Elm St, Austin, TX 78701",
      designation: "Frontend Developer",
      department: "IT",
      joining: new Date("2023-04-05"),
      role: "EMPLOYEE",
    },
    {
      email: "carol@dayflow.com",
      name: "Carol Davis",
      code: "EMP005",
      phone: "+1234567894",
      address: "654 Maple Ave, Seattle, WA 98101",
      designation: "Data Analyst",
      department: "Analytics",
      joining: new Date("2023-05-12"),
      role: "EMPLOYEE",
    },
    {
      email: "david@dayflow.com",
      name: "David Miller",
      code: "EMP006",
      phone: "+1234567895",
      address: "987 Oak Blvd, Denver, CO 80202",
      designation: "HR Manager",
      department: "Human Resources",
      joining: new Date("2023-06-01"),
      role: "MANAGER",
    },
    {
      email: "emma@dayflow.com",
      name: "Emma Taylor",
      code: "EMP007",
      phone: "+1234567896",
      address: "246 Birch Ln, Chicago, IL 60601",
      designation: "Marketing Specialist",
      department: "Marketing",
      joining: new Date("2023-07-15"),
      role: "EMPLOYEE",
    },
  ];

  const createdEmployees = [];

  for (const emp of employees) {
    const user = await prisma.user.create({
      data: {
        email: emp.email,
        password: employeePassword,
        role: (emp.role as "ADMIN" | "MANAGER" | "EMPLOYEE") || "EMPLOYEE",
        isActive: true,
        emailVerified: true,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeCode: emp.code,
        fullName: emp.name,
        phone: emp.phone,
        address: emp.address,
        designation: emp.designation,
        department: emp.department,
        joiningDate: emp.joining,
      },
    });

    createdEmployees.push(employee);
  }

  console.log("👥 Created employee users");

  // Create employee profiles
  const john = await prisma.employee.create({
    data: {
      userId: johnUser.id,
      employeeCode: "EMP001",
      fullName: "John Doe",
      phone: "+1234567890",
      address: "123 Main St, New York, NY 10001",
      designation: "Senior Developer",
      department: "IT",
      joiningDate: new Date("2023-01-15"),
    },
  });

  const jane = await prisma.employee.create({
    data: {
      userId: janeUser.id,
      employeeCode: "EMP002",
      fullName: "Jane Smith",
      phone: "+1234567891",
      address: "456 Oak Ave, San Francisco, CA 94102",
      designation: "UI/UX Designer",
      department: "Design",
      joiningDate: new Date("2023-02-20"),
    },
  });

  const allEmployees = [john, jane, ...createdEmployees];

  // Create payroll records
  await prisma.payroll.create({
    data: {
      employeeId: john.id,
      basicSalary: 60000,
      hra: 15000,
      allowances: 5000,
      deductions: 2000,
      netSalary: 78000,
    },
  });

  await prisma.payroll.create({
    data: {
      employeeId: jane.id,
      basicSalary: 55000,
      hra: 13750,
      allowances: 4500,
      deductions: 1800,
      netSalary: 71450,
    },
  });

  // Payroll for additional employees
  const payrollData = [
    { salary: 70000, hra: 17500, allowances: 6000, deductions: 2500 }, // Alice
    { salary: 50000, hra: 12500, allowances: 4000, deductions: 1500 }, // Bob
    { salary: 65000, hra: 16250, allowances: 5500, deductions: 2200 }, // Carol
    { salary: 75000, hra: 18750, allowances: 6500, deductions: 2700 }, // David
    { salary: 48000, hra: 12000, allowances: 3800, deductions: 1400 }, // Emma
  ];

  for (let i = 0; i < createdEmployees.length; i++) {
    const emp = createdEmployees[i];
    const data = payrollData[i];
    await prisma.payroll.create({
      data: {
        employeeId: emp.id,
        basicSalary: data.salary,
        hra: data.hra,
        allowances: data.allowances,
        deductions: data.deductions,
        netSalary: data.salary + data.hra + data.allowances - data.deductions,
      },
    });
  }

  console.log("💰 Created payroll records");

  // Create attendance records for the past week
  const today = new Date();
  const attendanceStatuses = ["PRESENT", "PRESENT", "ABSENT", "HALF_DAY", "PRESENT", "LEAVE", "PRESENT"];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    for (const emp of allEmployees) {
      const status = attendanceStatuses[i];

      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date: date
          }
        },
        update: {}, // Don't update if exists
        create: {
          employeeId: emp.id,
          date: date,
          status: status as "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE",
          checkIn: status !== "ABSENT" && status !== "LEAVE" ? new Date(date.setHours(9, Math.random() * 30, 0)) : null,
          checkOut: status === "PRESENT" ? new Date(date.setHours(17, 30 + Math.random() * 30, 0)) :
            status === "HALF_DAY" ? new Date(date.setHours(13, Math.random() * 60, 0)) : null,
        },
      });
    }
  }

  console.log("📅 Created attendance records");

  // Create leave requests
  await prisma.leaveRequest.create({
    data: {
      employeeId: john.id,
      type: "PAID",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-01-17"),
      days: 3,
      reason: "Family vacation",
      status: "PENDING",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: jane.id,
      type: "SICK",
      startDate: new Date("2025-12-20"),
      endDate: new Date("2025-12-21"),
      days: 2,
      reason: "Medical appointment",
      status: "APPROVED",
      approvedBy: admin.id,
      approvedAt: new Date("2025-12-18"),
      adminComment: "Get well soon!",
    },
  });

  // Additional leave request for John (approved)
  await prisma.leaveRequest.create({
    data: {
      employeeId: john.id,
      type: "SICK",
      startDate: new Date("2025-12-10"),
      endDate: new Date("2025-12-10"),
      days: 1,
      reason: "Doctor appointment",
      status: "APPROVED",
      approvedBy: admin.id,
      approvedAt: new Date("2025-12-09"),
    },
  });

  // Add leave requests for new employees
  await prisma.leaveRequest.create({
    data: {
      employeeId: createdEmployees[0].id, // Alice
      type: "PAID",
      startDate: new Date("2026-01-20"),
      endDate: new Date("2026-01-22"),
      days: 3,
      reason: "Personal work",
      status: "PENDING",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: createdEmployees[1].id, // Bob
      type: "UNPAID",
      startDate: new Date("2026-02-10"),
      endDate: new Date("2026-02-12"),
      days: 3,
      reason: "Travel",
      status: "APPROVED",
      approvedBy: admin.id,
      approvedAt: new Date("2026-01-25"),
      adminComment: "Approved",
    },
  });

  console.log("🏖️  Created leave requests");

  console.log("\n✅ Database seed completed successfully!");
  console.log("\n📧 Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("ADMIN:");
  console.log("  Email: admin@dayflow.com");
  console.log("  Password: admin123");
  console.log("\nEMPLOYEES:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1️⃣  John Doe (Senior Developer - IT)");
  console.log("   Email: john@dayflow.com | Password: employee123");
  console.log("\n2️⃣  Jane Smith (UI/UX Designer - Design)");
  console.log("   Email: jane@dayflow.com | Password: employee123");
  console.log("\n3️⃣  Alice Johnson (Product Manager - Product)");
  console.log("   Email: alice@dayflow.com | Password: employee123");
  console.log("\n4️⃣  Bob Wilson (Frontend Developer - IT)");
  console.log("   Email: bob@dayflow.com | Password: employee123");
  console.log("\n5️⃣  Carol Davis (Data Analyst - Analytics)");
  console.log("   Email: carol@dayflow.com | Password: employee123");
  console.log("\n6️⃣  David Miller (HR Manager - Human Resources)");
  console.log("   Email: david@dayflow.com | Password: employee123");
  console.log("\n7️⃣  Emma Taylor (Marketing Specialist - Marketing)");
  console.log("   Email: emma@dayflow.com | Password: employee123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
