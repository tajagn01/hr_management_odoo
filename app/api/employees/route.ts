import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { cache } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { getEmployeesCached, getEmployeeByIdCached, TAGS } from "@/lib/data";

// GET employees (all or by email)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");
    const includePayroll = searchParams.get("includePayroll") === "true";

    // Optimized: Use session data directly - removing blocking DB call
    const user = {
      role: (session.user as any).role,
      email: session.user.email,
      employee: (session.user as any).employeeId ? { id: (session.user as any).employeeId } : null
    };

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Get specific employee by ID (Cached)
    if (id) {
      const employee = await getEmployeeByIdCached(id);
      if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      return NextResponse.json({ employee });
    }

    // 2. Get specific employee by Email
    if (email) {
      const userEnt = await prisma.user.findUnique({
        where: { email },
        include: { employee: true }
      });

      if (!userEnt || !userEnt.employee) {
        return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
      }

      const employeeData = userEnt.employee;
      // Manually attach user info that frontend expects
      (employeeData as any).user = {
        email: userEnt.email,
        role: userEnt.role
      };

      return NextResponse.json({ employee: employeeData });
    }

    // 3. Get List (Cached)
    let employees;
    if (user.role === "ADMIN") {
      employees = await getEmployeesCached(undefined, includePayroll);
    } else if (user.role === "MANAGER" && user.employee) {
      employees = await getEmployeesCached(user.employee.id, includePayroll);
    } else {
      return NextResponse.json({ error: "Unauthorized to view all employees" }, { status: 403 });
    }

    return NextResponse.json({ employees, totalCount: employees.length });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

// POST new employee
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (adminUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can create employees" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, fullName, phone, address, designation, department, joiningDate } = body;

    // Create user first
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate employee code
    const employeeCount = await prisma.employee.count();
    const employeeCode = `EMP${String(employeeCount + 1).padStart(4, "0")}`;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "EMPLOYEE",
        employee: {
          create: {
            employeeCode,
            fullName,
            phone,
            address,
            designation,
            department,
            joiningDate: new Date(joiningDate),
          },
        },
      },
      include: {
        employee: true,
      },
    });

    // Invalidate cache
    revalidateTag(TAGS.employees, "max");

    return NextResponse.json(
      { message: "Employee created successfully", employee: user.employee },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}

// PUT update employee
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, phone, address, ...otherFields } = body;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { employee: true },
    });

    // Check if user can update (admin or own profile)
    const isAdmin = currentUser?.role === "ADMIN";
    const isOwnProfile = currentUser?.employee?.id === id;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json({ error: "Unauthorized to update this profile" }, { status: 403 });
    }

    // Non-admins can only update phone and address
    const updateData = isAdmin
      ? { phone, address, ...otherFields }
      : { phone, address };

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache
    revalidateTag(TAGS.employees, "max");

    return NextResponse.json({ message: "Employee updated successfully", employee });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

// DELETE employee
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (adminUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete employees" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    // Get employee to find user
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Delete employee (user will remain but without employee profile)
    await prisma.employee.delete({
      where: { id },
    });

    // Invalidate cache
    revalidateTag(TAGS.employees, "max");

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
