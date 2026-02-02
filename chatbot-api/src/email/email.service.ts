import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
   
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email credentials not configured. Using test mode.');
      console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
      return;
    }

   
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    
      debug: false,
      logger: false,
    });

   
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter configuration error:', error);
      } else {
        console.log('✅ Email transporter is ready to send emails');
      }
    });
  }

  async sendOTP(email: string, otp: string): Promise<void> {
   
    if (!this.transporter) {
      console.log(`📧 EMAIL NOT CONFIGURED - OTP for ${email}: ${otp}`);
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for ChatBot Registration',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">ChatBot - Email Verification</h2>
            <p>Thank you for registering with ChatBot!</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 3px;">${otp}</span>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This OTP will expire in 10 minutes</li>
              <li>Please do not share this OTP with anyone</li>
              <li>If you didn't request this OTP, please ignore this email</li>
            </ul>
            <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}`);
      console.log('Message ID:', result.messageId);
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
   
      throw new Error('Failed to send OTP email');
    }
  }

  async sendPasswordResetOTP(email: string, otp: string): Promise<void> {

    if (!this.transporter) {
      console.log(`📧 EMAIL NOT CONFIGURED - Password reset OTP for ${email}: ${otp}`);
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - ChatBot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">ChatBot - Password Reset</h2>
            <p>You requested a password reset for your ChatBot account.</p>
            <p>Your password reset OTP is:</p>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 3px;">${otp}</span>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This OTP will expire in 10 minutes</li>
              <li>Please do not share this OTP with anyone</li>
              <li>If you didn't request this password reset, please ignore this email</li>
            </ul>
            <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset OTP email sent to ${email}`);
      console.log('Message ID:', result.messageId);
    } catch (error) {
      console.error('❌ Failed to send password reset OTP email:', error);
      
      if (error.code === 'EAUTH') {
        console.error('🔧 Authentication failed. Please check your email configuration');
      } else if (error.code === 'ECONNECTION') {
        console.error('🔧 Connection failed. Please check your internet connection');
      }
      
      throw new Error('Failed to send password reset OTP email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
 
    if (!this.transporter) {
      console.log(`📧 EMAIL NOT CONFIGURED - Reset token for ${email}: ${resetToken}`);
      return;
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request - ChatBot',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">ChatBot - Password Reset</h2>
            <p>You requested a password reset for your ChatBot account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>For security reasons, make sure to use a strong password</li>
            </ul>
            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background: #f5f5f5; padding: 10px; word-break: break-all; font-size: 12px;">${resetUrl}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      console.log('Message ID:', result.messageId);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
     
      if (error.code === 'EAUTH') {
        console.error('🔧 Authentication failed. Please check your email configuration');
      } else if (error.code === 'ECONNECTION') {
        console.error('🔧 Connection failed. Please check your internet connection');
      }
      
      throw new Error('Failed to send password reset email');
    }
  }
}
