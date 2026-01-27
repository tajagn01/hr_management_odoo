/**
 * Notification API
 * GET: Fetch user's notifications
 * PATCH: Mark notification as read
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications - Fetch user's notifications
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.email) {
      console.error("❌ Notifications API: Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database with timeout
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    }).catch((err) => {
      console.error("❌ Notifications API: Database error finding user:", err);
      throw new Error("Database connection failed");
    });

    if (!user) {
      console.error("❌ Notifications API: User not found for email:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Fetch notifications with error handling
    const where = {
      userId: user.id,
      ...(unreadOnly ? { read: false } : {}),
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }).catch((err) => {
        console.error("❌ Notifications API: Error fetching notifications:", err);
        return [];
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }).catch((err) => {
        console.error("❌ Notifications API: Error counting notifications:", err);
        return 0;
      }),
    ]);

    // Debug logging for production
    console.log(`✅ Notifications API: Found ${notifications.length} notifications for user ${user.id} (${user.email})`);
    console.log(`✅ Notifications API: Unread count: ${unreadCount}`);
    if (notifications.length > 0) {
      console.log(`✅ Notifications API: Latest notification:`, {
        id: notifications[0].id,
        title: notifications[0].title,
        createdAt: notifications[0].createdAt,
      });
    }


    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        metadata: n.metadata,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (error: any) {
    console.error("❌ Error fetching notifications:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json({
      error: "Failed to fetch notifications",
      details: process.env.NODE_ENV === "development" ? error?.message : undefined
    }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all user's notifications as read
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    // Mark specific notification as read
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("❌ Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
