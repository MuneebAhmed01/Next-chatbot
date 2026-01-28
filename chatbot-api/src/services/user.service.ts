import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { randomBytes, randomInt } from 'crypto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  // Generate 6-digit OTP
  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  // Initiate signup - generate and send OTP
  async initiateSignup(name: string, email: string, password: string) {
    try {
      // Normalize email
      const normalizedEmail = email?.toLowerCase().trim();
      
      const existingUser = await this.userModel.findOne({ email: normalizedEmail, isVerified: true });
      if (existingUser) {
        throw new BadRequestException('Account already exists with this email');
      }

      // Remove any existing unverified user with same email
      await this.userModel.deleteOne({ email: normalizedEmail, isVerified: false });

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const newUser = new this.userModel({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        otp: otp,
        otpExpiry: otpExpiry,
        isVerified: false,
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
      if (error.code === 11000) {
        throw new BadRequestException('Account already exists with this email');
      }
      throw error;
    }
  }

  // Verify OTP and complete registration
  async verifyOTPAndSignup(email: string, otp: string) {
    // Normalize email
    const normalizedEmail = email?.toLowerCase().trim();
    const providedOTP = String(otp).trim();
    
    // First, find the user to debug
    const user = await this.userModel.findOne({ 
      email: normalizedEmail, 
      isVerified: false 
    }).lean(); // Use lean() to get plain object

    if (!user) {
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
    console.log('Final comparison:', `"${storedOTP}"` , '===', `"${providedOTP}"`, ':', storedOTP === providedOTP);

    if (storedOTP !== providedOTP) {
      throw new BadRequestException('Invalid OTP');
    }

    // OTP is valid - complete registration using findOneAndUpdate
    await this.userModel.findByIdAndUpdate(user._id, {
      $set: { isVerified: true },
      $unset: { otp: 1, otpExpiry: 1 }
    });

    return { 
      message: 'User created successfully', 
      userId: user._id 
    };
  }

  // Resend OTP for registration
  async resendOTP(email: string) {
    const user = await this.userModel.findOne({ 
      email, 
      isVerified: false 
    });

    if (!user) {
      throw new BadRequestException('No pending registration found for this email');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

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
    const user = await this.userModel.findOne({ email, isVerified: true });
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

    const resetToken = randomBytes(32).toString('hex') ;
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    return {
      message: 'Password reset token generated',
      resetToken: resetToken,
    };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      resetToken: token ,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return { message: 'Password reset successful' };
  }

  // Get user by ID
  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
