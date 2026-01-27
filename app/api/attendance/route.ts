// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/data";
import { auth } from "@/auth";
import {
  emitAttendanceCheckIn,
  emitAttendanceCheckOut,
  emitDashboardStats
} from "@/lib/realtime-emitter";
import { updateMonthlyAttendance } from "@/lib/attendance-aggregator";
import { logger } from "@/lib/logger";
import { calculateAttendanceStatus } from "@/lib/attendance-service";

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
    // Optimized: Use session data directly
    const user = {
      role: session.user.role,
      email: session.user.email,
      employee: session.user.employeeId ? { id: session.user.employeeId } : null
    };

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build where clause based on role
    const where: Record<string, unknown> = {};

    // Role-based access control optimization
    if (employeeId) {
      if (user.role === "ADMIN") {
        where.employeeId = employeeId;
      } else if (user.role === "MANAGER" && user.employee) {
        // Optimized: Check manager relation directly in the where clause of the attendance query if possible
        // But for security, we must verify the relationship first.
        // We can optimize by counting if there is a match instead of fetching all IDs
        const isTeamMember = await prisma.employee.count({
          where: {
            id: employeeId,
            managerId: user.employee.id
          }
        });

        if (isTeamMember === 0 && employeeId !== user.employee.id) {
          return NextResponse.json({ error: "Unauthorized to view this attendance" }, { status: 403 });
        }
        where.employeeId = employeeId;
      } else if (user.role === "EMPLOYEE" && user.employee?.id === employeeId) {
        where.employeeId = employeeId;
      } else {
        return NextResponse.json({ error: "Unauthorized to view this attendance" }, { status: 403 });
      }
    } else {
      // Filter logic for NO employeeId provided (My Attendance / Team Attendance)
      if (user.role === "ADMIN") {
        // All records
      } else if (user.role === "MANAGER" && user.employee) {
        // Fetch team IDs optimized
        const teamMembers = await prisma.employee.findMany({
          where: { managerId: user.employee.id },
          select: { id: true }
        });
        const teamIds = teamMembers.map(e => e.id);
        teamIds.push(user.employee.id); // Add self
        where.employeeId = { in: teamIds };
      } else if (user.employee) {
        where.employeeId = user.employee.id;
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

    // Optimized Fetch: Avoid joining Employee multiple times if we already know the employeeId
    let attendanceRecords;
    if (where.employeeId && typeof where.employeeId === 'string') {
      // Single employee fetch - split query optimization
      const [empDetails, records] = await Promise.all([
        prisma.employee.findUnique({
          where: { id: where.employeeId as string },
          select: { id: true, fullName: true, employeeCode: true, department: true, designation: true }
        }),
        prisma.attendance.findMany({
          where,
          orderBy: { date: "desc" },
          take: 100
        })
      ]);

      attendanceRecords = records.map(r => ({
        ...r,
        employee: empDetails || { id: "unknown" }
      }));
    } else {
      // Multiple employees - keep the join but limit fields
      attendanceRecords = await prisma.attendance.findMany({
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
        take: 100, // Limit results
      });
    }

    return NextResponse.json({ attendanceRecords }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    logger.error("Error fetching attendance", error);
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
        // @ts-ignore
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
          // @ts-ignore
          status: await calculateAttendanceStatus(employeeId, today),
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
            // @ts-ignore
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
      const workingHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      // Update attendance record with check-out and working hours
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: now,
          // @ts-ignore
          workingHours: Math.round(workingHours * 100) / 100, // Round to 2 decimal places
          // Recalculate status on check-out (e.g. check for HALF_DAY)
          // @ts-ignore
          status: await calculateAttendanceStatus(employeeId, today),
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
        workingHours: Math.round(workingHours * 100) / 100,
        timestamp: now.toISOString(),
      });

      // Trigger monthly attendance aggregation update
      try {
        await updateMonthlyAttendance(employeeId, now);
        logger.info("Monthly attendance updated", { employeeId });
      } catch (error) {
        logger.error("Error updating monthly attendance", error, { employeeId });
        // Don't fail the check-out if aggregation fails
      }
    } else {
      return NextResponse.json({ error: "Invalid type. Must be 'checkIn' or 'checkOut'" }, { status: 400 });
    }

    revalidateTag(TAGS.attendance, "default"); // Invalidate cache

    return NextResponse.json({
      message: `${type === "checkIn" ? "Checked in" : "Checked out"} successfully`,
      attendance,
      timestamp: now.toISOString(),
    }, { status: 201 });
  } catch (error) {
    logger.error("Error recording attendance", error);
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}
