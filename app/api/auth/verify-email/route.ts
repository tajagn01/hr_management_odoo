import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOTPEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimit(request, RateLimitPresets.moderate);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Find user with this email and OTP
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification request" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          message: "Email already verified. You can now login.",
          verified: true
        },
        { status: 200 }
      );
    }

    // Check if OTP matches
    if (user.verificationToken !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP. Please check and try again." },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (!user.verificationTokenExpiry || new Date() > user.verificationTokenExpiry) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify the email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return NextResponse.json(
      {
        message: "Email verified successfully! You can now login.",
        verified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Verification error", error);
    return NextResponse.json(
      { error: "An error occurred during verification. Please try again." },
      { status: 500 }
    );
  }
}

// Resend OTP endpoint
export async function PUT(request: NextRequest) {
  // Apply strict rate limiting for OTP resend
  const rateLimitResult = rateLimit(request, RateLimitPresets.otpResend);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: otp,
        verificationTokenExpiry: expiresAt,
      },
    });

    // Send OTP email using custom email service
    const emailResult = await sendOTPEmail(email, otp, user.employee?.fullName || "User");

    if (!emailResult.success) {
      logger.error("Failed to send OTP email", emailResult.error, { email });
      logger.warn("OTP NOT sent via email", { otp });
    }

    return NextResponse.json(
      {
        message: "New OTP sent to your email. Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Resend OTP error", error);
    return NextResponse.json(
      { error: "Failed to resend OTP. Please try again." },
      { status: 500 }
    );
  }
}

