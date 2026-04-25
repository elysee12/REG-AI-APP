import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  private getHtmlContent(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REG AI - Account Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #EF1C25 0%, #C8101A 100%); padding: 30px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">REG AI</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">AI-Powered Vandalism Detection</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 40px 30px;">
        ${content}
      </td>
    </tr>
    <tr>
      <td style="background-color: #f5f5f5; padding: 20px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="color: #666666; margin: 0; font-size: 12px;">This is an automated message from REG AI. Please do not reply to this email.</p>
        <p style="color: #999999; margin: 8px 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} REG AI. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendWelcomeEmail(to: string, fullName: string, password: string): Promise<void> {
    const html = this.getHtmlContent(`
      <h2 style="color: #1A1A1A; margin: 0 0 24px; font-size: 22px; font-weight: 600;">Welcome to REG AI!</h2>
      <p style="color: #444444; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">Dear <strong>${fullName}</strong>,</p>
      <p style="color: #444444; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">Your account has been successfully created. You can now access the REG AI platform using your credentials.</p>
      <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px; color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 4px 0; color: #444444; font-size: 14px;"><strong>Email:</strong></td>
            <td style="padding: 4px 0; color: #444444; font-size: 14px; text-align: right;">${to}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #444444; font-size: 14px;"><strong>Password:</strong></td>
            <td style="padding: 4px 0; color: #EF1C25; font-size: 14px; text-align: right; font-family: monospace; letter-spacing: 1px;"><strong>${password}</strong></td>
          </tr>
        </table>
      </div>
      <p style="color: #EF1C25; margin: 0 0 20px; font-size: 14px; font-weight: 500;">Important: Please change your password after your first login.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background: linear-gradient(135deg, #EF1C25 0%, #C8101A 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px;">Login to Your Account</a>
      </div>
      <p style="color: #888888; margin: 0; font-size: 13px; line-height: 1.6;">If you did not expect this email, please contact your system administrator immediately.</p>
    `);

    try {
      await this.transporter.sendMail({
        from: `"REG AI" <${process.env.SMTP_USER || 'noreply@regai.com'}>`,
        to,
        subject: 'Welcome to REG AI - Your Account is Ready',
        html,
      });
    } catch (error) {
      console.error(`Failed to send welcome email to ${to}:`, error.message);
      // Don't throw here to avoid breaking the user creation flow if mail fails
    }
  }

  async sendPasswordResetEmail(to: string, fullName: string, otp: string): Promise<void> {
    const html = this.getHtmlContent(`
      <h2 style="color: #1A1A1A; margin: 0 0 24px; font-size: 22px; font-weight: 600;">Password Reset Request</h2>
      <p style="color: #444444; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">Dear <strong>${fullName}</strong>,</p>
      <p style="color: #444444; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">We received a request to reset your account password. Please use the following verification code:</p>
      <div style="background-color: #1A1A1A; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; color: rgba(255,255,255,0.7); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
        <p style="margin: 0; color: #EF1C25; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">${otp}</p>
      </div>
      <div style="background-color: #fff3cd; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #F4A100;">
        <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.5;"><strong>Security Notice:</strong> This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email and contact your administrator.</p>
      </div>
      <p style="color: #888888; margin: 0; font-size: 13px; line-height: 1.6;">For your security, never share this code with anyone.</p>
    `);

    try {
      await this.transporter.sendMail({
        from: `"REG AI" <${process.env.SMTP_USER || 'noreply@regai.com'}>`,
        to,
        subject: 'REG AI - Password Reset Verification Code',
        html,
      });
    } catch (error) {
      console.error(`Failed to send password reset email to ${to}:`, error.message);
      throw error; // Rethrow for reset since it's a critical action
    }
  }

  async sendPasswordChangeConfirmation(to: string, fullName: string): Promise<void> {
    const html = this.getHtmlContent(`
      <h2 style="color: #1A1A1A; margin: 0 0 24px; font-size: 22px; font-weight: 600;">Password Changed Successfully</h2>
      <p style="color: #444444; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">Dear <strong>${fullName}</strong>,</p>
      <p style="color: #444444; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">Your account password has been successfully changed.</p>
      <div style="background-color: #d4edda; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #1E9E57;">
        <p style="margin: 0; color: #155724; font-size: 13px; line-height: 1.5;"><strong>Success:</strong> Your password was updated on ${new Date().toLocaleString()}.</p>
      </div>
      <p style="color: #888888; margin: 0; font-size: 13px; line-height: 1.6;">If you did not make this change, please contact your administrator immediately.</p>
    `);

    try {
      await this.transporter.sendMail({
        from: `"REG AI" <${process.env.SMTP_USER || 'noreply@regai.com'}>`,
        to,
        subject: 'REG AI - Password Changed Successfully',
        html,
      });
    } catch (error) {
      console.error(`Failed to send password change confirmation to ${to}:`, error.message);
    }
  }
}
