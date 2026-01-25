import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { sendOTPEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimit(request, RateLimitPresets.strict);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: "Email already registered and verified. Please login instead." },
          { status: 409 }
        );
      } else {
        // User exists but not verified - regenerate OTP
        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

        await prisma.user.update({
          where: { email },
          data: {
            verificationToken: otp,
            verificationTokenExpiry: expiresAt,
          },
        });

        // Send OTP email
        logger.info("Sending OTP email for existing user", { email });
        const emailResult = await sendOTPEmail(email, otp, name);

        if (!emailResult.success) {
          logger.error("Email sending failed for existing user", emailResult.error, { email });
          return NextResponse.json(
            { error: emailResult.error || "Failed to send verification email. Please check server console for OTP." },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            message: "Verification OTP sent to your email. Please check your inbox.",
            requiresVerification: true,
            email,
          },
          { status: 200 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Generate employee code
    const employeeCount = await prisma.employee.count();
    const employeeCode = `EMP${String(employeeCount + 1).padStart(4, "0")}`;

    // Create user with employee profile (not verified yet)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "EMPLOYEE",
        isActive: true,
        emailVerified: false,
        verificationToken: otp,
        verificationTokenExpiry: expiresAt,
        employee: {
          create: {
            employeeCode,
            fullName: name,
            designation: "Employee",
            department: "General",
            joiningDate: new Date(),
          },
        },
      },
      include: {
        employee: true,
      },
    });

    // Send OTP email
    logger.info("Sending OTP email for new user", { email });
    const emailResult = await sendOTPEmail(email, otp, name);

    if (!emailResult.success) {
      logger.error("Email sending failed for new user", emailResult.error, { email });
      // Don't delete user - allow them to use OTP from console
      // But show error message
      return NextResponse.json(
        {
          error: emailResult.error || "Failed to send verification email. Please check server console for OTP code.",
          requiresVerification: true,
          email,
        },
        { status: 200 } // Return 200 so user can still verify with console OTP
      );
    }

    return NextResponse.json(
      {
        message: "Account created! Please verify your email with the OTP sent to your inbox.",
        requiresVerification: true,
        email,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error("Registration error", error);

    // Provide more specific error messages
    let errorMessage = "An error occurred during registration. Please try again.";

    if (error?.code === "P2002") {
      errorMessage = "Email already exists. Please use a different email or login instead.";
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.code) {
      errorMessage = `Database error: ${error.code}`;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
