import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  emitAttendanceCheckIn,
  emitAttendanceCheckOut,
  emitDashboardStats
} from "@/lib/realtime-emitter";

// GET attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get current user to check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build where clause
    const where: Record<string, unknown> = {};

    // If employeeId is provided and user is admin, allow viewing any employee's attendance
    // If employeeId is provided and user is employee, only allow viewing their own attendance
    // If no employeeId, show current user's attendance
    if (employeeId) {
      if (user.role === "ADMIN") {
        where.employeeId = employeeId;
      } else if (user.role === "EMPLOYEE" && user.employee?.id === employeeId) {
        where.employeeId = employeeId;
      } else {
        return NextResponse.json({ error: "Unauthorized to view this attendance" }, { status: 403 });
      }
    } else {
      // No employeeId provided
      if (user.role === "ADMIN") {
        // Admins can see all attendance records when no employeeId is specified
        // Don't filter by employeeId - show all
      } else if (user.employee) {
        // Employees see their own attendance
        where.employeeId = user.employee.id;
      } else {
        return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
      }
    }

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      where.date = {
        gte: start,
        lte: end,
      };
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where,
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
      orderBy: {
        date: "desc",
      },
      take: 100, // Limit results for better performance
    });

    return NextResponse.json({ attendanceRecords });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance records" }, { status: 500 });
  }
}

// POST check-in or check-out
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, type } = body; // type: "checkIn" or "checkOut"

    if (!employeeId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { employee: true },
    });

    if (!user?.employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    // Employees can only check in/out for themselves
    if (user.role === "EMPLOYEE" && user.employee.id !== employeeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if attendance record exists for today
    let attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (type === "checkIn") {
      if (attendance) {
        return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
      }

      // Get employee details for real-time event
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { fullName: true },
      });

      // Create new attendance record with check-in
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          status: "PRESENT",
          checkIn: now,
        },
        include: {
          employee: {
            select: {
              fullName: true,
            },
          },
        },
      });

      // Emit real-time event
      emitAttendanceCheckIn({
        employeeId,
        employeeName: employee?.fullName || "Unknown",
        checkInTime: now.toISOString(),
        status: "PRESENT",
        timestamp: now.toISOString(),
      });

      // Update dashboard stats
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todayRecords = await prisma.attendance.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: {
            in: ["PRESENT", "HALF_DAY"],
          },
        },
      });

      const totalEmployees = await prisma.employee.count();
      const allLeaves = await prisma.leaveRequest.findMany({
        where: { status: "PENDING" },
      });
      const employees = await prisma.employee.findMany({
        include: { payroll: true },
      });
      const monthlyPayroll = employees.reduce((sum, emp) => {
        return sum + (emp.payroll?.netSalary || 0);
      }, 0);

      emitDashboardStats({
        totalEmployees,
        presentToday: todayRecords.length,
        pendingLeaves: allLeaves.length,
        monthlyPayroll,
        timestamp: now.toISOString(),
      });
    } else if (type === "checkOut") {
      if (!attendance) {
        return NextResponse.json({ error: "Please check in first" }, { status: 400 });
      }

      if (attendance.checkOut) {
        return NextResponse.json({ error: "Already checked out today" }, { status: 400 });
      }

      // Get employee details for real-time event
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { fullName: true },
      });

      // Calculate working hours
      const checkInTime = attendance.checkIn ? new Date(attendance.checkIn) : now;
      const workingHours = Math.round((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60) * 10) / 10;

      // Update attendance record with check-out
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: now,
        },
        include: {
          employee: {
            select: {
              fullName: true,
            },
          },
        },
      });

      // Emit real-time event
      emitAttendanceCheckOut({
        employeeId,
        employeeName: employee?.fullName || "Unknown",
        checkOutTime: now.toISOString(),
        workingHours,
        timestamp: now.toISOString(),
      });
    } else {
      return NextResponse.json({ error: "Invalid type. Must be 'checkIn' or 'checkOut'" }, { status: 400 });
    }

    return NextResponse.json({
      message: `${type === "checkIn" ? "Checked in" : "Checked out"} successfully`,
      attendance,
      timestamp: now.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error recording attendance:", error);
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}
