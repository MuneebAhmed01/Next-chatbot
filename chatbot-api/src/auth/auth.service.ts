import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<any>,
    private otpService: OtpService
  ) {}

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
      
      let hashedPassword;

      if (existingPendingUser) {
        // Update existing pending user
        hashedPassword = await bcrypt.hash(password, 10);
        
        await this.userModel.findByIdAndUpdate(existingPendingUser._id, {
          name,
          password: hashedPassword,
        });
      } else {
        // Create new pending user
        hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new this.userModel({
          name,
          email: normalizedEmail,
          password: hashedPassword,
          credits: 0,
          isVerified: false,
          createdAt: new Date(),
        });

        await newUser.save();
      }

      // Send OTP using OTP service
      return this.otpService.sendSignupOTP(normalizedEmail, name);
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string) {
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
    return this.otpService.sendPasswordResetOTP(email);
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.otpService.verifyPasswordResetOTP(email, otp);
    
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

    return { 
      message: 'Password reset successful. You can now login with your new password.' 
    };
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

  async verifyOTP(email: string, otp: string) {
    return this.otpService.verifyOTP(email, otp);
  }

  async resendOTP(email: string) {
    return this.otpService.resendOTP(email);
  }
}
