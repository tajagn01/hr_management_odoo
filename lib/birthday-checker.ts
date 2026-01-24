import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// Generic email sending function for birthday emails
async function sendEmail(options: { to: string; subject: string; html: string }) {
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
        to: options.to,
        subject: options.subject,
        html: options.html
    });
}

export async function checkBirthdays() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1; // JavaScript months are 0-indexed
        const day = today.getDate();

        console.log(`🔍 Checking birthdays for ${month}/${day}...`);
        console.log(`📅 Today (local): ${today.toLocaleDateString()}`);

        // Find all active employees
        const employees = await prisma.employee.findMany({
            where: {
                user: {
                    isActive: true
                }
            },
            include: {
                user: {
                    select: {
                        email: true
                    }
                }
            }
        });

        console.log(`📋 Found ${employees.length} active employees`);

        // Filter employees whose birthday is today
        const birthdayEmployees = employees.filter((emp: any) => {
            if (!emp.dateOfBirth) return false;
            const birthDate = new Date(emp.dateOfBirth);

            // Use UTC date components to avoid timezone issues
            const birthMonth = birthDate.getUTCMonth() + 1;
            const birthDay = birthDate.getUTCDate();

            console.log(`👤 ${emp.fullName}: Birthday ${birthMonth}/${birthDay} (checking against ${month}/${day})`);

            return birthMonth === month && birthDay === day;
        });

        console.log(`🎂 Found ${birthdayEmployees.length} birthday(s) today`);

        // Send birthday emails
        for (const employee of birthdayEmployees) {
            try {
                await sendBirthdayEmail(employee);
                console.log(`✅ Sent birthday email to ${employee.fullName} (${employee.user.email})`);
            } catch (error) {
                console.error(`❌ Failed to send birthday email to ${employee.fullName}:`, error);
            }
        }

        return {
            success: true,
            count: birthdayEmployees.length
        };
    } catch (error) {
        console.error("Error checking birthdays:", error);
        return {
            success: false,
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
            padding: 20px 10px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #4f46e5;
            padding: 40px 30px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #4b5563;
            line-height: 1.8;
            margin-bottom: 20px;
        }
        .highlight-box {
            background-color: #f3f4f6;
            border-left: 4px solid #4f46e5;
            padding: 20px;
            margin: 30px 0;
        }
        .highlight-box p {
            font-size: 16px;
            color: #374151;
            font-weight: 500;
            margin: 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        .company-name {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 20px;
        }
        .disclaimer {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 20px;
        }
        
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px 5px;
            }
            .header {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .content {
                padding: 30px 20px;
            }
            .greeting {
                font-size: 16px;
            }
            .message {
                font-size: 15px;
            }
            .highlight-box {
                padding: 15px;
            }
            .footer {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Happy Birthday!</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Dear ${employee.fullName},</p>
            
            <p class="message">
                Wishing you a wonderful birthday filled with joy, laughter, and all the happiness you deserve.
            </p>
            
            <p class="message">
                We want to take this moment to thank you for being an invaluable member of our team. Your dedication, hard work, and positive attitude make a real difference every single day.
            </p>
            
            <div class="highlight-box">
                <p>May this year bring you continued success, good health, and countless moments of happiness.</p>
            </div>
            
            <p class="message">
                Enjoy your special day to the fullest!
            </p>
        </div>
        
        <div class="footer">
            <p class="company-name">DayFlow HRMS Team</p>
            <p class="footer-text">Best wishes from all of us</p>
            <p class="disclaimer">This is an automated message from the DayFlow HR Management System.</p>
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
