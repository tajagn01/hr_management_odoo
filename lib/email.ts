import nodemailer from "nodemailer";

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  from: string; // Sender email address
  fromName?: string; // Sender name
}

// Create email transporter based on configuration
function createTransporter() {
  // Option 1: Use environment variables for SMTP configuration
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT;
  const SMTP_SECURE = process.env.SMTP_SECURE === "true";
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
  const SMTP_FROM = process.env.SMTP_FROM;
  const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "DayFlow HRMS";

  console.log("\n📧 Email Configuration Check:");
  console.log("   SMTP_HOST:", SMTP_HOST || "❌ Not set");
  console.log("   SMTP_PORT:", SMTP_PORT || "❌ Not set");
  console.log("   SMTP_USER:", SMTP_USER || "❌ Not set");
  console.log("   SMTP_PASSWORD:", SMTP_PASSWORD ? "✅ Set" : "❌ Not set");
  console.log("   SMTP_FROM:", SMTP_FROM || "❌ Not set");

  // If all SMTP config is provided, use it
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD && SMTP_FROM) {
    console.log("   ✅ Using custom SMTP configuration");
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }

  // Option 2: Use Gmail (if only user/password provided)
  if (SMTP_USER && SMTP_PASSWORD && !SMTP_HOST) {
    console.log("   ✅ Using Gmail SMTP");
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }

  console.log("   ⚠️ No email service configured - OTP will be in console\n");
  return null;
}

// Send OTP email
export async function sendOTPEmail(
  to: string,
  otp: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log("⚠️ Email service not configured. OTP for", to, ":", otp);
      console.log("⚠️ ⚠️ ⚠️ USE THIS OTP TO VERIFY:", otp, "⚠️ ⚠️ ⚠️");
      return { success: true }; // Allow registration even without email
    }

    const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
    const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "DayFlow HRMS";

    const fromEmail = SMTP_FROM || process.env.SMTP_USER || "noreply@dayflow.com";
    const fromName = SMTP_FROM_NAME || "DayFlow HRMS";

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: to,
      subject: "Verify Your Email - DayFlow HRMS",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                
                <!-- Main Card -->
                <table border="0" cellpadding="0" cellspacing="0" width="560" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; max-width: 90%;">
                  
                  <!-- Top Border Strip (Brand Color) -->
                  <tr>
                    <td height="4" style="background-color: #4f46e5;"></td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 48px;">
                      
                      <!-- Brand -->
                      <div style="margin-bottom: 32px;">
                        <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">DayFlow HRMS</span>
                      </div>

                      <!-- Greeting & Message -->
                      <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">Verify your email address</h1>
                      
                      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                        Hi <strong>${name}</strong>,<br><br>
                        Thanks for getting started with DayFlow! We need a little more information to complete your registration, including a confirmation of your email address.
                      </p>

                      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                        Your verification code is:
                      </p>

                      <!-- OTP Box -->
                      <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 32px;">
                        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">${otp}</span>
                      </div>

                      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0;">
                        This code is valid for 10 minutes. If you didn't request a verification code, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 48px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
                        &copy; ${new Date().getFullYear()} DayFlow HRMS.<br>
                        Sent securely by DayFlow Identity System.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Verify your email address - DayFlow HRMS
        
        Hi ${name},
        
        Thanks for getting started with DayFlow! We need a little more information to complete your registration, including a confirmation of your email address.
        
        Your verification code is: ${otp}
        
        This code is valid for 10 minutes. If you didn't request a verification code, you can safely ignore this email.
        
        © ${new Date().getFullYear()} DayFlow HRMS.
        Sent securely by DayFlow Identity System.
      `,
    };

    console.log("📤 Attempting to send email to:", to);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", to);
    console.log("   Message ID:", info.messageId);
    console.log("   Response:", info.response);
    return { success: true };
  } catch (error: any) {
    console.error("\n❌ ERROR SENDING EMAIL:");
    console.error("   To:", to);
    console.error("   Error Code:", error.code);
    console.error("   Error Message:", error.message);
    if (error.response) {
      console.error("   SMTP Response:", error.response);
    }
    if (error.responseCode) {
      console.error("   Response Code:", error.responseCode);
    }
    console.error("");
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

// Test email configuration
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      return {
        success: false,
        error: "Email service not configured. Please set SMTP environment variables.",
      };
    }

    // Verify connection
    await transporter.verify();
    console.log("✅ Email server connection verified");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Email configuration test failed:", error);
    return {
      success: false,
      error: error.message || "Failed to connect to email server",
    };
  }
}

