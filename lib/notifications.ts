/**
 * Simple Notification Service
 * Handles creating notifications and emitting Socket.IO events
 */

import { prisma } from "@/lib/prisma";
import { getSocketIO } from "@/lib/socket-server";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification and emit via Socket.IO
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, metadata } = params;

  // Save to database
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata: metadata || null,
    },
  });

  console.log(`📦 Notification saved: ${notification.id} for user ${userId}`);

  // Emit via Socket.IO
  const io = getSocketIO();
  if (io) {
    // Emit to user's room
    io.to(`user:${userId}`).emit("notification:new", {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      metadata: notification.metadata,
      createdAt: notification.createdAt.toISOString(),
    });
    console.log(`📤 Emitted notification to user:${userId}`);
  } else {
    console.warn("⚠️ Socket.IO not initialized, notification saved but not emitted");
  }

  return notification;
}

/**
 * Create notification for all admins
 */
export async function notifyAdmins(params: Omit<CreateNotificationParams, "userId">) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const notifications = await Promise.all(
    admins.map((admin) =>
      createNotification({
        ...params,
        userId: admin.id,
      })
    )
  );

  // Notifications are already emitted via createNotification to each admin's user room
  // No need to emit to role room separately - each admin will receive their notification
  return notifications;
}
