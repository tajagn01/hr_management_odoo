import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TAGS } from "@/lib/data";

// GET payroll records
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    console.log("API/PAYROLL GET:", { url: request.url, employeeId, user: session?.user?.email });

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
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { employeeId, basicSalary, hra, allowances, deductions } = body;

    if (!employeeId || basicSalary === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const basic = Number(basicSalary);
    const hraVal = Number(hra || 0);
    const allow = Number(allowances || 0);
    const deduct = Number(deductions || 0);
    const netSalary = (basic + hraVal + allow) - deduct;

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        basicSalary: basic,
        hra: hraVal,
        allowances: allow,
        deductions: deduct,
        netSalary,
      }
    });

    revalidateTag(TAGS.payroll, "max");
    revalidateTag(TAGS.employees, "max");

    return NextResponse.json({
      message: "Payroll created",
      payroll
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating payroll:", error);
    return NextResponse.json({ error: "Failed to create payroll" }, { status: 500 });
  }
}

// PUT update payroll
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, basicSalary, hra, allowances, deductions } = body;
    console.log("API/PAYROLL PUT:", { id, basicSalary, hra, user: session?.user?.email });

    if (!id) {
      return NextResponse.json({ error: "Payroll ID is required" }, { status: 400 });
    }

    // Calculate new net salary if financial fields are present
    const dataToUpdate: {
      basicSalary?: number;
      hra?: number;
      allowances?: number;
      deductions?: number;
      netSalary?: number;
    } = {};
    if (basicSalary !== undefined) dataToUpdate.basicSalary = Number(basicSalary);
    if (hra !== undefined) dataToUpdate.hra = Number(hra);
    if (allowances !== undefined) dataToUpdate.allowances = Number(allowances);
    if (deductions !== undefined) dataToUpdate.deductions = Number(deductions);

    // We need to fetch existing values to calc net salary correctly if partial update, 
    // but for simplicity assuming full financial update or just separate calculates.
    // Better to recalculate netSalary if any component changes.

    // Fetch current to calculate net
    const currentPayroll = await prisma.payroll.findUnique({ where: { id } });
    if (!currentPayroll) return NextResponse.json({ error: "Payroll not found" }, { status: 404 });

    const newBasic = basicSalary !== undefined ? Number(basicSalary) : currentPayroll.basicSalary;
    const newHra = hra !== undefined ? Number(hra) : currentPayroll.hra;
    const newAllow = allowances !== undefined ? Number(allowances) : currentPayroll.allowances;
    const newDeduct = deductions !== undefined ? Number(deductions) : currentPayroll.deductions;

    dataToUpdate.netSalary = (newBasic + newHra + newAllow) - newDeduct;

    const payroll = await prisma.payroll.update({
      where: { id },
      data: dataToUpdate
    });

    revalidateTag(TAGS.payroll, "max");
    revalidateTag(TAGS.employees, "max");

    return NextResponse.json({
      message: "Payroll updated",
      payroll
    });
  } catch (error) {
    console.error("Error updating payroll:", error);
    return NextResponse.json({ error: "Failed to update payroll" }, { status: 500 });
  }
}
