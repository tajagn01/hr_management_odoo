import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// Generic email sending function
async function sendEmail(options: { to: string; subject: string; html: string }) {
    const testOverride = process.env.TEST_EMAIL_TO?.trim();
    const recipient = testOverride || options.to;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
    const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "DayFlow HRMS";

    await transporter.sendMail({
        from: `${SMTP_FROM_NAME} <${SMTP_FROM}>`,
        to: recipient,
        subject: options.subject,
        html: options.html
    });
}

// In-App Notification Helper
async function notifyAdminsAndManager(employee: any, title: string, message: string, type: "INFO" | "SUCCESS" | "WARNING" | "ERROR") {
    // 1. Notify Manager
    if (employee.managerId) {
        const manager = await prisma.employee.findUnique({
            where: { id: employee.managerId },
            include: { user: true } // Need user ID for notification
        });

        if (manager && manager.user) {
            await prisma.notification.create({
                data: {
                    userId: manager.user.id,
                    type: type,
                    title: title,
                    message: message,
                    metadata: { employeeId: employee.id }
                }
            });
            console.log(`🔔 Notified Manager: ${manager.fullName}`);
        }
    }

    // 2. Notify Admins
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN" }
    });

    for (const admin of admins) {
        await prisma.notification.create({
            data: {
                userId: admin.id,
                type: type,
                title: title,
                message: message,
                metadata: { employeeId: employee.id }
            }
        });
    }
    console.log(`🔔 Notified ${admins.length} Admins`);
}


export interface DailyEventResult {
    success: boolean;
    birthdayCount: number;
    anniversaryCount: number;
    error?: any;
}

export async function checkDailyEvents(): Promise<DailyEventResult> {
    try {
        // Use IST (UTC+5:30) for date matching - Indian Standard Time
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const now = new Date();
        const istNow = new Date(now.getTime() + IST_OFFSET_MS);
        const month = istNow.getUTCMonth() + 1;
        const day = istNow.getUTCDate();
        const currentYear = istNow.getUTCFullYear();

        console.log(`Checking daily events for IST ${day}/${month}/${currentYear}...`);

        // Find active employees
        const employees = await prisma.employee.findMany({
            where: {
                user: {
                    isActive: true
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            }
        });

        console.log(`📋 Found ${employees.length} active employees`);

        let birthdayCount = 0;
        let anniversaryCount = 0;

        for (const emp of employees) {
            // --- BIRTHDAY CHECK ---
            if (emp.dateOfBirth) {
                const birthDate = new Date(emp.dateOfBirth);
                const istBirthDate = new Date(birthDate.getTime() + IST_OFFSET_MS); // Shift stored date to IST
                const birthMonth = istBirthDate.getUTCMonth() + 1;
                const birthDay = istBirthDate.getUTCDate();

                if (birthMonth === month && birthDay === day) {
                    console.log(`Birthday found: ${emp.fullName}`);
                    birthdayCount++;

                    try {
                        await sendBirthdayEmail(emp);
                        await notifyAdminsAndManager(
                            emp,
                            "Birthday Alert",
                            `Today is ${emp.fullName}'s birthday!`,
                            "INFO"
                        );
                    } catch (e) {
                        console.error(`❌ Error processing birthday for ${emp.fullName}`, e);
                    }
                }
            }

            // --- ANNIVERSARY CHECK ---
            if (emp.joiningDate) {
                const joinDate = new Date(emp.joiningDate);
                const istJoinDate = new Date(joinDate.getTime() + IST_OFFSET_MS); // Shift stored date to IST
                const joinMonth = istJoinDate.getUTCMonth() + 1;
                const joinDay = istJoinDate.getUTCDate();
                const joinYear = istJoinDate.getUTCFullYear();

                const yearsCompleted = currentYear - joinYear;

                if (joinMonth === month && joinDay === day && yearsCompleted > 0) {
                    console.log(`Anniversary found: ${emp.fullName} (${yearsCompleted} years)`);
                    anniversaryCount++;

                    try {
                        await sendAnniversaryEmail(emp, yearsCompleted);
                        await notifyAdminsAndManager(
                            emp,
                            "Work Anniversary",
                            `${emp.fullName} has completed ${yearsCompleted} year${yearsCompleted > 1 ? 's' : ''} with us today!`,
                            "SUCCESS"
                        );
                    } catch (e) {
                        console.error(`❌ Error processing anniversary for ${emp.fullName}`, e);
                    }
                }
            }
        }

        return {
            success: true,
            birthdayCount,
            anniversaryCount
        };

    } catch (error) {
        console.error("Error checking daily events:", error);
        return {
            success: false,
            birthdayCount: 0,
            anniversaryCount: 0,
            error
        };
    }
}

async function sendBirthdayEmail(employee: any) {
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Happy Birthday</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f3f4f6; padding: 20px 10px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }
        .header { background: #4f46e5; padding: 36px 28px; text-align: center; color: #ffffff; }
        .header h1 { font-size: 26px; font-weight: 600; letter-spacing: -0.4px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #111827; }
        .message { font-size: 15px; color: #4b5563; margin-bottom: 16px; }
        .highlight { background: #eef2ff; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; color: #1f2937; }
        .footer { background: #f9fafb; padding: 22px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer .company { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 6px; }
        .footer .note { font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>Happy Birthday</h1></div>
        <div class="content">
            <p class="greeting">Dear ${employee.fullName},</p>
            <p class="message">Wishing you a wonderful birthday filled with joy, health, and happiness.</p>
            <p class="message">Thank you for your dedication and the positive impact you bring to the team.</p>
            <div class="highlight">May this year bring new opportunities and continued success.</div>
            <p class="message">Enjoy your special day.</p>
        </div>
        <div class="footer">
            <div class="company">DayFlow HRMS Team</div>
            <div class="note">This is an automated message from the DayFlow HR Management System.</div>
        </div>
    </div>
</body>
</html>`;

    await sendEmail({
        to: employee.user.email,
        subject: `Happy Birthday ${employee.fullName}`,
        html: emailHtml
    });
}

async function sendAnniversaryEmail(employee: any, years: number) {
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Happy Work Anniversary</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f3f4f6; padding: 20px 10px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }
        .header { background: #10b981; padding: 36px 28px; text-align: center; color: #ffffff; }
        .header h1 { font-size: 26px; font-weight: 600; letter-spacing: -0.4px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #111827; }
        .message { font-size: 15px; color: #4b5563; margin-bottom: 16px; }
        .highlight { background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; color: #065f46; font-weight: 600; text-align: center; }
        .footer { background: #f9fafb; padding: 22px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer .company { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 6px; }
        .footer .note { font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>Happy Work Anniversary</h1></div>
        <div class="content">
            <p class="greeting">Dear ${employee.fullName},</p>
            <p class="message">Congratulations on reaching another milestone with us.</p>
            <div class="highlight">${years} Year${years > 1 ? 's' : ''} of Excellence</div>
            <p class="message">We appreciate your commitment, contributions, and the positive impact you bring to our team.</p>
            <p class="message">Thank you for being a valued part of DayFlow.</p>
        </div>
        <div class="footer">
            <div class="company">DayFlow HRMS Team</div>
            <div class="note">This is an automated message from the DayFlow HR Management System.</div>
        </div>
    </div>
</body>
</html>`;

    await sendEmail({
        to: employee.user.email,
        subject: `Happy ${years} Year Anniversary ${employee.fullName}`,
        html: emailHtml
    });
}
