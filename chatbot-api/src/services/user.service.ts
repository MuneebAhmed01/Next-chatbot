import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import User from '../models/user.model';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<any>) { }

  // Generate 6-digit OTP
  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  // Initiate signup - generate and send OTP
  async initiateSignup(name: string, email: string, password: string) {
    try {
      // Normalize email
      const normalizedEmail = email?.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await this.userModel.findOne({ email: normalizedEmail });
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      // Generate OTP
      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create temporary user with OTP
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

      // Debug log - remove in production
      console.log(`OTP for ${normalizedEmail}: ${otp} (expires: ${otpExpiry})`);

      return {
        message: 'OTP sent to your email',
        email: normalizedEmail,
        otp: otp
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

    // Check if OTP exists
    if (!user.otp) {
      throw new BadRequestException('No OTP found. Please request a new one');
    }

    // Check if OTP is expired
    if (!user.otpExpiry || new Date(user.otpExpiry).getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    // Compare OTP
    const storedOTP = String(user.otp).trim();
    console.log('Final comparison:', `"${storedOTP}"`, '===', `"${providedOTP}"`, ':', storedOTP === providedOTP);

    if (storedOTP !== providedOTP) {
      throw new BadRequestException('Invalid OTP');
    }

    // OTP is valid - complete registration
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

  // Resend OTP for registration
  async resendOTP(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user || user.isVerified) {
      throw new BadRequestException('No pending registration found for this email');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.userModel.findByIdAndUpdate(user._id, {
      otp,
      otpExpiry,
    });

    // TODO: Send OTP via email here
    console.log(`New OTP for ${email}: ${otp}`); // Remove in production

    return {
      message: 'OTP resent to your email',
      // Remove this in production - only for testing
      otp: otp
    };
  }

  // Auth user
  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
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

  // Forgot password - generate reset token
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('No account found with this email');
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.userModel.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    return {
      message: 'Password reset token generated',
      resetToken: resetToken,
    };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      $unset: {
        resetToken: 1,
        resetTokenExpiry: 1,
      },
    });

    return { message: 'Password reset successful' };
  }

  // Get user by ID
  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  // Google Login
  async googleLogin(email: string, name: string, googleId: string) {
    const normalizedEmail = email?.toLowerCase().trim();

    let user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
      // Create new user if not exists
      // Generate a random password since they use Google to login
      const randomPassword = randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = new this.userModel({
        email: normalizedEmail,
        name,
        password: hashedPassword,
        isVerified: true, // Auto-verify email from Google
        credits: 0,
        createdAt: new Date(),
      });

      await user.save();
    } else {
      // If user exists but wasn't verified, verify them now since we trust Google
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
