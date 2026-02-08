import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { cache } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { getLeavesCached, TAGS } from "@/lib/data";
import { notifyAdmins } from "@/lib/notifications";
import { createNotification } from "@/lib/notifications";
import { leaveRequestCreateSchema, leaveRequestUpdateSchema, formatZodError } from "@/lib/validators";
import { logger } from "@/lib/logger";
import { MAX_LEAVE_DAYS } from "@/lib/constants";

// GET leave requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const userRole = session.user.role;
    const userEmployeeId = session.user.employeeId;

    let queryParams: any = { status };

    if (employeeId) {
      if (userRole === "EMPLOYEE" && employeeId !== userEmployeeId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      queryParams.employeeId = employeeId;
    } else {
      if (userRole === "EMPLOYEE") {
        queryParams.employeeId = userEmployeeId;
      }
    }

    const leaveRequests = await getLeavesCached(queryParams);

    return NextResponse.json({ leaveRequests });
  } catch (error) {
    logger.error("Error fetching leave requests", error);
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 });
  }
}

// POST new leave request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = leaveRequestCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: formatZodError(validation.error)
      }, { status: 400 });
    }

    const { employeeId, type, startDate, endDate, reason } = validation.data;

    // Calculate number of days (inclusive of both start and end dates)
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize to start of day (midnight) to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Validate that dates are not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json({
        error: "Cannot create leave request for past dates"
      }, { status: 400 });
    }

    // Calculate difference in days
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    // Add 1 because both start and end dates are inclusive
    const days = daysDiff + 1;

    // Validate that days is at least 1
    if (days < 1) {
      return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
    }

    // Validate maximum leave days
    if (days > MAX_LEAVE_DAYS) {
      return NextResponse.json({
        error: `Leave request cannot exceed ${MAX_LEAVE_DAYS} days`
      }, { status: 400 });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            // New leave starts during existing leave
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } }
            ]
          },
          {
            // New leave ends during existing leave
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } }
            ]
          },
          {
            // New leave completely contains existing leave
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } }
            ]
          }
        ]
      }
    });

    if (overlappingLeave) {
      return NextResponse.json({
        error: "You already have a leave request for overlapping dates"
      }, { status: 400 });
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        type: type.toUpperCase() as "PAID" | "SICK" | "UNPAID",
        startDate: start,
        endDate: end,
        days,
        reason,
        status: "PENDING",
      },
      include: {
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    // Invalidate cache
    revalidateTag(TAGS.leaves, "max");

    // Notify all admins about new leave request
    try {
      await notifyAdmins({
        type: "INFO",
        title: "New Leave Request",
        message: `${leaveRequest.employee.fullName} requested ${leaveRequest.days} day(s) of ${leaveRequest.type.toLowerCase()} leave`,
        metadata: {
          leaveId: leaveRequest.id,
          employeeId: leaveRequest.employeeId,
          employeeName: leaveRequest.employee.fullName,
          type: leaveRequest.type,
          days: leaveRequest.days,
        },
      });
    } catch (error) {
      logger.error("Failed to send leave request notification", error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(
      { message: "Leave request submitted successfully", leaveRequest },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error creating leave request", error);
    return NextResponse.json({ error: "Failed to submit leave request" }, { status: 500 });
  }
}

// PUT update leave request (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can approve/reject leave requests" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = leaveRequestUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: formatZodError(validation.error)
      }, { status: 400 });
    }

    const { id, status, adminComment } = validation.data;

    // Update leave request
    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: status.toUpperCase() as "APPROVED" | "REJECTED",
        approvedBy: user.id,
        approvedAt: new Date(),
        adminComment: adminComment || null,
      },
      include: {
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });

    // Invalidate cache
    revalidateTag(TAGS.leaves, "max");

    // Notify employee about leave status change
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: leaveRequest.employeeId },
        include: { user: true },
      });

      if (employee?.user) {
        await createNotification({
          userId: employee.user.id,
          type: status.toUpperCase() === "APPROVED" ? "SUCCESS" : "ERROR",
          title: `Leave Request ${status.toUpperCase() === "APPROVED" ? "Approved" : "Rejected"}`,
          message: `Your ${leaveRequest.type.toLowerCase()} leave request for ${leaveRequest.days} day(s) has been ${status.toLowerCase()}${adminComment ? `: ${adminComment}` : ""}`,
          metadata: {
            leaveId: leaveRequest.id,
            type: leaveRequest.type,
            days: leaveRequest.days,
            status: status.toUpperCase(),
          },
        });
      }
    } catch (error) {
      logger.error("Failed to send leave status notification", error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leaveRequest,
    });
  } catch (error) {
    logger.error("Error updating leave request", error);
    return NextResponse.json({ error: "Failed to update leave request" }, { status: 500 });
  }
}
