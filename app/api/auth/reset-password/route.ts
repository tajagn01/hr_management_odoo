import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { sendPasswordResetEmail } from "@/lib/email";

// Password reset request schema
const resetRequestSchema = z.object({
    email: z.string().email("Invalid email address"),
});

// Password reset confirm schema
const resetConfirmSchema = z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * POST /api/auth/reset-password
 * Request a password reset email
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = resetRequestSchema.parse(body);

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            logger.info("Password reset requested for non-existent email", { email });
            return NextResponse.json({
                message: "If the email exists, a reset link has been sent",
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            } as any, // TODO: Remove 'as any' after running 'npx prisma generate' to update client types
        });

        // Send email with reset link
        const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        if (process.env.NODE_ENV === "development") {
            logger.info("Password reset requested", {
                email,
                resetLink,
            });
        } else {
            logger.info("Password reset requested", { email });
        }

        // Send email
        const emailResult = await sendPasswordResetEmail(email, resetLink);

        if (!emailResult) {
            logger.error("Failed to send password reset email", { email });
            return NextResponse.json(
                { error: "Failed to send reset email" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "If the email exists, a reset link has been sent",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        logger.error("Error in password reset request", error);
        return NextResponse.json(
            { error: "Failed to process password reset request" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/auth/reset-password
 * Confirm password reset with token
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, newPassword } = resetConfirmSchema.parse(body);

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(), // Token not expired
                },
            } as any,
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid or expired reset token" },
                { status: 400 }
            );
        }

        // Hash new password
        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            } as any,
        });

        logger.info("Password reset successful", { userId: user.id });

        return NextResponse.json({
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 }
            );
        }

        logger.error("Error in password reset confirmation", error);
        return NextResponse.json(
            { error: "Failed to reset password" },
            { status: 500 }
        );
    }
}
