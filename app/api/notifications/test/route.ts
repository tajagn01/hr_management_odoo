/**
 * Diagnostic endpoint to test notification creation
 * POST /api/notifications/test - Create test notification for current user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log(`🧪 Test Notification: Creating for user ${user.id} (${user.email}, ${user.role})`);

        // Create test notification
        const notification = await createNotification({
            userId: user.id,
            type: "INFO",
            title: "Test Notification",
            message: `This is a test notification created at ${new Date().toISOString()}`,
            metadata: {
                test: true,
                timestamp: new Date().toISOString(),
            },
        });

        console.log(`✅ Test Notification: Created successfully`, {
            id: notification.id,
            userId: notification.userId,
            title: notification.title,
        });

        // Verify it was saved
        const savedNotification = await prisma.notification.findUnique({
            where: { id: notification.id },
        });

        console.log(`✅ Test Notification: Verified in database`, {
            found: !!savedNotification,
            id: savedNotification?.id,
        });

        // Count total notifications for this user
        const totalCount = await prisma.notification.count({
            where: { userId: user.id },
        });

        console.log(`✅ Test Notification: Total notifications for user: ${totalCount}`);

        return NextResponse.json({
            success: true,
            notification: {
                id: notification.id,
                userId: notification.userId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                createdAt: notification.createdAt.toISOString(),
            },
            totalNotifications: totalCount,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error: any) {
        console.error("❌ Test Notification Error:", {
            message: error?.message,
            stack: error?.stack,
        });
        return NextResponse.json(
            {
                error: "Failed to create test notification",
                details: error?.message,
            },
            { status: 500 }
        );
    }
}
