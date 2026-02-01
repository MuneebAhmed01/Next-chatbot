import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import User from '../models/user.model';
import * as bcrypt from 'bcrypt';
import { randomInt, randomBytes } from 'crypto';
import { EmailService } from './email/email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private userModel: Model<any>,
    private emailService: EmailService
  ) {}

  
  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  
  async initiateSignup(name: string, email: string, password: string) {
    try {
      
      const normalizedEmail = email?.toLowerCase().trim();

      // Check if user already exists and is verified
      const existingVerifiedUser = await this.userModel.findOne({ 
        email: normalizedEmail, 
        isVerified: true 
      });
      if (existingVerifiedUser) {
        throw new BadRequestException('User already exists');
      }

      // Check if there's a pending registration
      const existingPendingUser = await this.userModel.findOne({ 
        email: normalizedEmail, 
        isVerified: false 
      });
      
      let otp, otpExpiry, hashedPassword;

      if (existingPendingUser) {
        // Update existing pending user
        otp = this.generateOTP();
        otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        hashedPassword = await bcrypt.hash(password, 10);
        
        await this.userModel.findByIdAndUpdate(existingPendingUser._id, {
          name,
          password: hashedPassword,
          otp,
          otpExpiry,
        });
      } else {
        // Create new pending user
        otp = this.generateOTP();
        otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new this.userModel({
          name,
          email: normalizedEmail,
          password: hashedPassword,
          credits: 0,
          otp,
          otpExpiry,
          isVerified: false,
          createdAt: new Date(),
        });

        await newUser.save();
      }

      // Send OTP email
      try {
        await this.emailService.sendOTP(normalizedEmail, otp);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Still return success but log the error for development
        console.log(`OTP for ${normalizedEmail}: ${otp} (expires: ${otpExpiry})`);
      }

      return {
        message: 'OTP sent to your email',
        email: normalizedEmail,
        otp: otp // For development, remove this in production
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify OTP and complete registration
  async verifyOTPAndSignup(email: string, otp: string) {
    // Normalize email
    const normalizedEmail = email?.toLowerCase().trim();
    const providedOTP = String(otp).trim();

    // Find the user
    const user = await this.userModel.findOne({ email: normalizedEmail });


    if (!user) {
      console.log('verifyOTPAndSignup - User not found for email:', normalizedEmail);
      console.log('Original email provided:', email);
      throw new BadRequestException('No pending registration found for this email');
    }

    // Debug logging - remove in production
    console.log('=== OTP DEBUG ===');
    console.log('User found:', JSON.stringify(user, null, 2));
    console.log('Stored OTP:', `"${user.otp}"`, 'Type:', typeof user.otp);
    console.log('Provided OTP:', `"${providedOTP}"`, 'Type:', typeof providedOTP);
    console.log('OTP Expiry:', user.otpExpiry);
    console.log('Current time:', new Date());
    console.log('Is expired:', user.otpExpiry ? new Date(user.otpExpiry).getTime() < Date.now() : 'no expiry');

  
    if (!user.otp) {
      throw new BadRequestException('No OTP found. Please request a new one');
    }

    if (!user.otpExpiry || new Date(user.otpExpiry).getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

  
    const storedOTP = String(user.otp).trim();
    console.log('Final comparison:', `"${storedOTP}"`, '===', `"${providedOTP}"`, ':', storedOTP === providedOTP);

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

  async resendOTP(email: string) {
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user || user.isVerified) {
      throw new BadRequestException('No pending registration found for this email');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.userModel.findByIdAndUpdate(user._id, {
      otp,
      otpExpiry,
    });

    // Send OTP email
    try {
      await this.emailService.sendOTP(normalizedEmail, otp);
      console.log(`OTP email resent to ${normalizedEmail}`);
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError);
      console.log(`New OTP for ${normalizedEmail}: ${otp} (expires: ${otpExpiry})`);
    }

    return {
      message: 'OTP resent to your email',
      otp: otp // For development, remove this in production
    };
  }

  
  async login(email: string, password: string) {
    // Normalize email
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is verified
    if (user.isVerified === false) {
      throw new UnauthorizedException('Account not verified. Please check your email and verify your account.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    
    console.log('=== FORGOT PASSWORD DEBUG ===');
    console.log('Email:', normalizedEmail);
    console.log('User found:', !!user);
    
    if (!user) {
      // Don't reveal if email exists or not for security
      console.log('Email not found in database - returning generic message');
      throw new BadRequestException('If this email is registered, you will receive password reset instructions');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('Generated OTP:', otp);
    console.log('OTP Expiry:', otpExpiry);

    await this.userModel.findByIdAndUpdate(user._id, {
      passwordResetOTP: otp,
      passwordResetOTPExpiry: otpExpiry,
    });

    console.log('OTP saved to database for user:', normalizedEmail);

    // Send password reset OTP email
    try {
      await this.emailService.sendPasswordResetOTP(normalizedEmail, otp);
      console.log(`Password reset OTP email sent to ${normalizedEmail}`);
    } catch (emailError) {
      console.error('Failed to send password reset OTP email:', emailError);
      console.log(`Password reset OTP for ${normalizedEmail}: ${otp} (expires: ${otpExpiry})`);
    }

    return {
      message: 'If this email is registered, you will receive password reset instructions',
      // Don't return OTP in production
    };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = email?.toLowerCase().trim();
    const providedOTP = String(otp).trim();

    console.log('=== PASSWORD RESET DEBUG ===');
    console.log('Email:', normalizedEmail);
    console.log('Provided OTP:', `"${providedOTP}"`);

    // Find the user with valid password reset OTP
    const user = await this.userModel.findOne({
      email: normalizedEmail,
      passwordResetOTP: { $exists: true },
      passwordResetOTPExpiry: { $gt: new Date() },
    });

    console.log('User found:', !!user);
    if (user) {
      console.log('Stored OTP:', `"${user.passwordResetOTP}"`);
      console.log('OTP Expiry:', user.passwordResetOTPExpiry);
      console.log('Current time:', new Date());
      console.log('Is expired:', new Date(user.passwordResetOTPExpiry).getTime() < Date.now());
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP. Please request a new password reset.');
    }

    // Verify OTP
    const storedOTP = String(user.passwordResetOTP).trim();
    console.log('Final comparison:', `"${storedOTP}" === "${providedOTP}" =`, storedOTP === providedOTP);
    
    if (storedOTP !== providedOTP) {
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP fields
    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      $unset: {
        passwordResetOTP: 1,
        passwordResetOTPExpiry: 1,
      },
    });

    console.log('Password reset successful for:', normalizedEmail);

    return { 
      message: 'Password reset successful. You can now login with your new password.' 
    };
  }

  // Get user by ID
  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async googleLogin(email: string, name: string, googleId: string) {
    const normalizedEmail = email?.toLowerCase().trim();

    let user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
   
      const randomPassword = randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = new this.userModel({
        email: normalizedEmail,
        name,
        password: hashedPassword,
        isVerified: true, 
        credits: 0,
        createdAt: new Date(),
      });

      await user.save();
    } else {
    
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    }

    return {
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits
      },
    };
  }
}
