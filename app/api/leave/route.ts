import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { cache } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { getLeavesCached, TAGS } from "@/lib/data";
import { notifyAdmins } from "@/lib/notifications";
import { createNotification } from "@/lib/notifications";

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
    console.error("Error fetching leave requests:", error);
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
    const { employeeId, type, startDate, endDate, reason } = body;

    // Validate required fields
    if (!employeeId || !type || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate number of days (inclusive of both start and end dates)
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize to start of day (midnight) to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    // Add 1 because both start and end dates are inclusive
    const days = daysDiff + 1;

    // Validate that days is at least 1
    if (days < 1) {
      return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        type: type.toUpperCase(),
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
    revalidateTag(TAGS.leaves, "default");

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
      console.error("Failed to send notification:", error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json(
      { message: "Leave request submitted successfully", leaveRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating leave request:", error);
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
    const { id, status, adminComment } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate status
    if (!["APPROVED", "REJECTED"].includes(status.toUpperCase())) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update leave request
    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
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
    revalidateTag(TAGS.leaves, "default");

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
      console.error("Failed to send notification:", error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leaveRequest,
    });
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json({ error: "Failed to update leave request" }, { status: 500 });
  }
}
