import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Send email using configured SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"HR Management" <noreply@hrmanagement.com>',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });

        logger.info('Email sent successfully', {
            to: options.to,
            subject: options.subject,
            messageId: info.messageId,
        });

        return true;
    } catch (error) {
        logger.error('Failed to send email', {
            to: options.to,
            subject: options.subject,
            error,
        });
        return false;
    }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password for your HR Management account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${resetLink}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HR Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    Password Reset Request
    
    We received a request to reset your password for your HR Management account.
    
    Click this link to reset your password:
    ${resetLink}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email.
  `;

    return sendEmail({
        to: email,
        subject: 'Password Reset Request - HR Management',
        html,
        text,
    });
}

/**
 * Send leave approval notification email
 */
export async function sendLeaveApprovalEmail(
    email: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    status: 'APPROVED' | 'REJECTED',
    adminComment?: string
): Promise<boolean> {
    const statusColor = status === 'APPROVED' ? '#10B981' : '#EF4444';
    const statusText = status === 'APPROVED' ? 'Approved' : 'Rejected';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .status { display: inline-block; padding: 8px 16px; background: ${statusColor}; color: white; border-radius: 4px; font-weight: bold; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Leave Request ${statusText}</h1>
        </div>
        <div class="content">
          <p>Hello ${employeeName},</p>
          <p>Your leave request has been <span class="status">${statusText}</span></p>
          <div class="details">
            <p><strong>Leave Type:</strong> ${leaveType}</p>
            <p><strong>Start Date:</strong> ${startDate}</p>
            <p><strong>End Date:</strong> ${endDate}</p>
            ${adminComment ? `<p><strong>Admin Comment:</strong> ${adminComment}</p>` : ''}
          </div>
          <p>If you have any questions, please contact your manager or HR department.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HR Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: `Leave Request ${statusText} - HR Management`,
        html,
    });
}

/**
 * Send birthday/anniversary notification email
 */
export async function sendEventNotificationEmail(
    email: string,
    employeeName: string,
    eventType: 'birthday' | 'anniversary',
    date: string
): Promise<boolean> {
    const subject = eventType === 'birthday'
        ? `🎂 Happy Birthday ${employeeName}!`
        : `🎉 Happy Work Anniversary ${employeeName}!`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; text-align: center; }
        .emoji { font-size: 64px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          <div class="emoji">${eventType === 'birthday' ? '🎂🎉' : '🎊🎈'}</div>
          <p style="font-size: 18px;">Dear ${employeeName},</p>
          <p style="font-size: 16px;">
            ${eventType === 'birthday'
            ? 'Wishing you a wonderful birthday filled with joy and happiness!'
            : `Congratulations on your work anniversary! Thank you for your dedication and hard work.`
        }
          </p>
          <p>Best wishes from the entire team!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} HR Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject,
        html,
    });
}
