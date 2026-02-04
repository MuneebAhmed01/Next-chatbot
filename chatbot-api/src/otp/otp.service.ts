import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel('User') private userModel: Model<any>,
    private emailService: EmailService
  ) {}

  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  async sendSignupOTP(email: string, name?: string): Promise<{ message: string; email: string; otp: string }> {
    const normalizedEmail = email?.toLowerCase().trim();
    
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new BadRequestException('No pending registration found for this email');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account already verified');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    await this.userModel.findByIdAndUpdate(user._id, {
      otp,
      otpExpiry,
      ...(name && { name })
    });

    // Send OTP email
    try {
      await this.emailService.sendOTP(normalizedEmail, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      console.log(`OTP for ${normalizedEmail}: ${otp} (expires: ${otpExpiry})`);
    }

    return {
      message: 'OTP sent to your email',
      email: normalizedEmail,
      otp: otp 
    };
  }

  async verifyOTP(email: string, otp: string): Promise<{ message: string; userId: string }> {
    const normalizedEmail = email?.toLowerCase().trim();
    const providedOTP = String(otp).trim();

    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
      throw new BadRequestException('No pending registration found for this email');
    }

    if (!user.otp) {
      throw new BadRequestException('No OTP found. Please request a new one');
    }

    if (!user.otpExpiry || new Date(user.otpExpiry).getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    const storedOTP = String(user.otp).trim();

    if (storedOTP !== providedOTP) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.userModel.findByIdAndUpdate(user._id, {
      isVerified: true,
      $unset: {
        otp: 1,
        otpExpiry: 1,
      },
    });

    return {
      message: 'User created successfully',
      userId: user._id
    };
  }

  async resendOTP(email: string): Promise<{ message: string; otp: string }> {
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user || user.isVerified) {
      throw new BadRequestException('No pending registration found for this email');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    await this.userModel.findByIdAndUpdate(user._id, {
      otp,
      otpExpiry,
    });

    try {
      await this.emailService.sendOTP(normalizedEmail, otp);
      console.log(`OTP email resent to ${normalizedEmail}`);
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError);
      console.log(`New OTP for ${normalizedEmail}: ${otp} (expires: ${otpExpiry})`);
    }

    return {
      message: 'OTP resent to your email',
      otp: otp 
    };
  }

  async sendPasswordResetOTP(email: string): Promise<{ message: string }> {
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    
    if (!user) {
    
      throw new BadRequestException('If this email is registered, you will receive password reset instructions');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    await this.userModel.findByIdAndUpdate(user._id, {
      passwordResetOTP: otp,
      passwordResetOTPExpiry: otpExpiry,
    });

    
    try {
      await this.emailService.sendPasswordResetOTP(normalizedEmail, otp);
    } catch (emailError) {
      console.error('Failed to send password reset OTP email:', emailError);
      console.log(`Password reset OTP for ${normalizedEmail}: ${otp} (expires: ${otpExpiry})`);
    }

    return {
      message: 'If this email is registered, you will receive password reset instructions',
    };
  }

  async verifyPasswordResetOTP(email: string, otp: string): Promise<any> {
    const normalizedEmail = email?.toLowerCase().trim();
    const providedOTP = String(otp).trim();

    const user = await this.userModel.findOne({
      email: normalizedEmail,
      passwordResetOTP: { $exists: true },
      passwordResetOTPExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP. Please request a new password reset.');
    }

    const storedOTP = String(user.passwordResetOTP).trim();
    
    if (storedOTP !== providedOTP) {
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    return user;
  }
}
