import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET payroll records
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    // Get current user to check permissions
    // Optimized: Use session data directly
    const user = {
      role: session.user.role,
      email: session.user.email,
      employee: session.user.employeeId ? { id: session.user.employeeId } : null
    };

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build where clause
    let targetEmployeeId: string;

    if (employeeId) {
      // If employeeId is provided and user is admin, allow viewing any employee's payroll
      // If employeeId is provided and user is employee, only allow viewing their own payroll
      if (user.role === "ADMIN") {
        targetEmployeeId = employeeId;
      } else if (user.role === "EMPLOYEE" && user.employee?.id === employeeId) {
        targetEmployeeId = employeeId;
      } else {
        return NextResponse.json({ error: "Unauthorized to view this payroll" }, { status: 403 });
      }
    } else {
      // No employeeId provided, show current user's payroll
      if (!user.employee) {
        return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
      }
      targetEmployeeId = user.employee.id;
    }

    // Get payroll record
    const payroll = await prisma.payroll.findUnique({
      where: { employeeId: targetEmployeeId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!payroll) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    return NextResponse.json({ payroll });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json({ error: "Failed to fetch payroll records" }, { status: 500 });
  }
}

// POST create payroll
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Validate and save payroll to database using Prisma

    return NextResponse.json({
      message: "Payroll created",
      payroll: body
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create payroll" }, { status: 500 });
  }
}

// PUT update payroll
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Update payroll in database using Prisma

    return NextResponse.json({
      message: "Payroll updated",
      payroll: body
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payroll" }, { status: 500 });
  }
}
